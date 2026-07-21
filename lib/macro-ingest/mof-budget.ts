/**
 * MoF Statistical Review — budget revenues/expenditures + annual GDP → balance/GDP %.
 *
 * Sources (EN Statistical Review page):
 * - Table 1 Budget revenues (monthly) — Total Revenues
 * - Table 3 Budget expenditures (monthly) — Total Expenditures
 * - Table 2 GDP — Income approach annual values — Gross domestic product (MKD million)
 *
 * Series: calendar-year YTD balance through each quarter-end ÷ annual GDP × 100.
 * For incomplete years, denominator is the latest completed annual GDP.
 */

import * as cheerio from 'cheerio'
import * as XLSX from 'xlsx'
import type { MacroPoint } from '../macro'

const REVIEW_URL = 'https://finance.gov.mk/en-GB/oblasti/statisticki-pregled'

export type MofFetchResult = {
    points: MacroPoint[]
    note: string
}

type Link = { text: string; href: string }

async function fetchBuffer(url: string): Promise<Buffer> {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'TalirMacroBot/1.0 (+https://talir.mk)' },
    })
    if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`)
    return Buffer.from(await res.arrayBuffer())
}

async function discoverLinks(): Promise<Link[]> {
    const res = await fetch(REVIEW_URL, {
        headers: { 'User-Agent': 'TalirMacroBot/1.0 (+https://talir.mk)' },
    })
    if (!res.ok) throw new Error(`MoF review page HTTP ${res.status}`)
    const html = await res.text()
    const $ = cheerio.load(html)
    const links: Link[] = []
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href') ?? ''
        if (!/\.xls[x]?$/i.test(href)) return
        const abs = href.startsWith('http') ? href : new URL(href, 'https://finance.gov.mk').toString()
        links.push({
            text: $(el).text().replace(/\s+/g, ' ').trim(),
            href: abs,
        })
    })
    return links
}

function pickLink(links: Link[], patterns: RegExp[]): string | null {
    for (const re of patterns) {
        const hit = links.find((l) => re.test(l.text) || re.test(l.href))
        if (hit) return hit.href
    }
    return null
}

/** Parse wide month headers like "I 2006", "II", … "XII", "I 2007" into ISO month starts. */
function parseMonthHeaders(headerRow: unknown[]): (string | null)[] {
    const out: (string | null)[] = [null] // column 0 is labels
    let year: number | null = null
    const romans: Record<string, number> = {
        I: 1,
        II: 2,
        III: 3,
        IV: 4,
        V: 5,
        VI: 6,
        VII: 7,
        VIII: 8,
        IX: 9,
        X: 10,
        XI: 11,
        XII: 12,
    }

    for (let i = 1; i < headerRow.length; i++) {
        const raw = String(headerRow[i] ?? '')
            .replace(/\s+/g, ' ')
            .trim()
        if (!raw) {
            out.push(null)
            continue
        }
        const withYear = raw.match(/^(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)\s+(\d{4})$/i)
        if (withYear) {
            year = Number(withYear[2])
            const month = romans[withYear[1]!.toUpperCase()]
            out.push(month && year ? `${year}-${String(month).padStart(2, '0')}-01` : null)
            continue
        }
        const monthOnly = raw.match(/^(I{1,3}|IV|V|VI{0,3}|IX|X|XI|XII)$/i)
        if (monthOnly && year != null) {
            const month = romans[monthOnly[1]!.toUpperCase()]
            // Crossing into next year when we see I after XII
            if (month === 1 && out[out.length - 1]?.endsWith('-12-01')) {
                year += 1
            }
            out.push(month ? `${year}-${String(month).padStart(2, '0')}-01` : null)
            continue
        }
        out.push(null)
    }
    return out
}

function readTotalRow(
    wb: XLSX.WorkBook,
    sheetName: string,
    labelMatch: RegExp
): { dates: string[]; values: number[] } {
    const sheet = wb.Sheets[sheetName]
    if (!sheet) throw new Error(`Missing sheet ${sheetName}`)
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][]
    const header = rows.find((r) =>
        (r ?? []).some((c) => typeof c === 'string' && /^(I{1,3}|IV|V)\s+\d{4}$/i.test(String(c).trim()))
    )
    if (!header) throw new Error(`No month header in ${sheetName}`)
    const dates = parseMonthHeaders(header)
    const dataRow = rows.find((r) => labelMatch.test(String(r?.[0] ?? '').trim()))
    if (!dataRow) throw new Error(`No total row matching ${labelMatch} in ${sheetName}`)

    const outDates: string[] = []
    const values: number[] = []
    for (let i = 1; i < dates.length; i++) {
        const d = dates[i]
        const v = dataRow[i]
        if (!d || v == null || v === '') continue
        const n = typeof v === 'number' ? v : Number(String(v).replace(',', ''))
        if (!Number.isFinite(n)) continue
        outDates.push(d)
        values.push(n)
    }
    return { dates: outDates, values }
}

function readAnnualGdp(wb: XLSX.WorkBook): Map<number, number> {
    const sheetName =
        wb.SheetNames.find((n) => /income approach \(annual values\)/i.test(n)) ??
        'Income approach (annual values)'
    const sheet = wb.Sheets[sheetName]
    if (!sheet) throw new Error('Missing GDP income-approach sheet')
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null }) as unknown[][]
    const header = rows.find((r) =>
        (r ?? []).some((c) => typeof c === 'string' && /gross domestic product/i.test(c))
    )
    if (!header) throw new Error('GDP header row not found')
    const gdpCol = header.findIndex(
        (c) => typeof c === 'string' && /gross domestic product/i.test(c)
    )
    if (gdpCol < 0) throw new Error('GDP column not found')

    const map = new Map<number, number>()
    for (const row of rows) {
        const yRaw = row?.[0]
        const year =
            typeof yRaw === 'number'
                ? yRaw
                : Number(String(yRaw ?? '').replace(/\D/g, '').slice(0, 4))
        if (!Number.isFinite(year) || year < 1990 || year > 2100) continue
        const v = row?.[gdpCol]
        const n = typeof v === 'number' ? v : Number(v)
        if (!Number.isFinite(n) || n <= 0) continue
        map.set(year, n)
    }
    return map
}

function resolveGdp(year: number, annual: Map<number, number>): number | null {
    if (annual.has(year)) return annual.get(year)!
    // Incomplete / not-yet-published year → prior year
    for (let y = year - 1; y >= year - 5; y--) {
        if (annual.has(y)) return annual.get(y)!
    }
    return null
}

function buildQuarterlyBalancePct(
    monthlyBalance: Map<string, number>,
    annualGdp: Map<number, number>
): MacroPoint[] {
    const months = [...monthlyBalance.keys()].sort()
    if (!months.length) return []

    const byYearMonth = new Map<string, number>()
    for (const d of months) byYearMonth.set(d.slice(0, 7), monthlyBalance.get(d)!)

    const points: MacroPoint[] = []
    const years = [...new Set(months.map((d) => Number(d.slice(0, 4))))].sort()

    for (const year of years) {
        const gdp = resolveGdp(year, annualGdp)
        if (!gdp) continue
        let ytd = 0
        for (const q of [1, 2, 3, 4] as const) {
            const endMonth = q * 3
            const startMonth = endMonth - 2
            let quarterSum = 0
            let have = 0
            let lastMonth = 0
            for (let m = startMonth; m <= endMonth; m++) {
                const key = `${year}-${String(m).padStart(2, '0')}`
                if (!byYearMonth.has(key)) continue
                quarterSum += byYearMonth.get(key)!
                have++
                lastMonth = m
            }
            if (have === 0) continue
            ytd += quarterSum
            const pct = Math.round((ytd / gdp) * 1000) / 10
            // Complete quarter → quarter-end date; partial → last available month
            const month = have === 3 ? endMonth : lastMonth
            points.push({
                date: `${year}-${String(month).padStart(2, '0')}-01`,
                value: pct,
            })
        }
    }
    return points
}

export async function fetchMofBudgetBalanceGdp(): Promise<MofFetchResult> {
    try {
        const links = await discoverLinks()
        const revUrl = pickLink(links, [
            /budget revenues\s*\(monthly/i,
            /Table 1\.\s*Budget revenues/i,
        ])
        const expUrl = pickLink(links, [
            /budget expenditures\s*\(monthly/i,
            /Table 3\.\s*Budget expenditures/i,
        ])
        const gdpUrl = pickLink(links, [/gross domestic product/i, /Table 2\.\s*Gross domestic/i])

        if (!revUrl || !expUrl || !gdpUrl) {
            return {
                points: [],
                note: `MoF links incomplete rev=${!!revUrl} exp=${!!expUrl} gdp=${!!gdpUrl}`,
            }
        }

        const [revWb, expWb, gdpWb] = await Promise.all([
            fetchBuffer(revUrl).then((b) => XLSX.read(b, { type: 'buffer' })),
            fetchBuffer(expUrl).then((b) => XLSX.read(b, { type: 'buffer' })),
            fetchBuffer(gdpUrl).then((b) => XLSX.read(b, { type: 'buffer' })),
        ])

        const rev = readTotalRow(revWb, 'Total Revenues', /^Total Revenues$/i)
        const exp = readTotalRow(expWb, 'Total Expenditures', /^Total Expenditures$/i)
        const annualGdp = readAnnualGdp(gdpWb)

        const balance = new Map<string, number>()
        const expByDate = new Map(exp.dates.map((d, i) => [d, exp.values[i]!]))
        for (let i = 0; i < rev.dates.length; i++) {
            const d = rev.dates[i]!
            const e = expByDate.get(d)
            if (e == null) continue
            balance.set(d, rev.values[i]! - e)
        }

        const points = buildQuarterlyBalancePct(balance, annualGdp)
        return {
            points,
            note: `MoF budget/GDP: ${points.length} quarterly points (YTD balance / annual GDP); rev=${rev.dates.length} exp=${exp.dates.length} gdpYears=${annualGdp.size}`,
        }
    } catch (err) {
        return {
            points: [],
            note: `MoF fetch error: ${err instanceof Error ? err.message : String(err)}`,
        }
    }
}
