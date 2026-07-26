import * as cheerio from 'cheerio'
import fs from 'fs'
import path from 'path'
import { parseAmountMk, resolveProfitYear, type DividendCalendarEntry } from './dividends'
import type { FundamentalEntry } from './fundamentals'

export interface MseYearRatios {
    dps: number | null
    eps: number | null
    dividendYieldPct: number | null
}

export interface MseSymbolRatiosIssuer {
    years: Record<string, MseYearRatios>
}

export interface MseSymbolRatiosFile {
    generatedAt: string
    byCode: Record<string, MseSymbolRatiosIssuer>
}

export function mseSymbolPageUrl(stockCode: string, profitYear?: number): string {
    const base = `https://www.mse.mk/en/symbol/${encodeURIComponent(stockCode)}`
    return profitYear != null ? `${base}#fy-${profitYear}` : base
}

/** Parse US-style MSE table cells: 28.93, 12,531,346, 6.29%. */
export function parseMseRatioNumber(raw: string): number | null {
    const trimmed = raw.replace(/\s+/g, ' ').trim()
    if (!trimmed || /^[-–—]$/.test(trimmed)) return null

    const pct = trimmed.match(/^([\d.,]+)\s*%$/)
    if (pct) {
        const n = Number(pct[1].replace(/,/g, ''))
        return Number.isFinite(n) ? n : null
    }

    return parseAmountMk(trimmed)
}

function normalizeRowLabel(text: string): string {
    return text.replace(/\s+/g, ' ').trim().toLowerCase()
}

/**
 * Parse Fin.Ratios (and any sibling ratio table) from an MSE symbol page HTML.
 * Returns year → { dps, eps, dividendYieldPct }.
 */
export function parseMseSymbolRatiosHtml(html: string): Record<string, MseYearRatios> {
    const $ = cheerio.load(html)
    const byYear: Record<string, MseYearRatios> = {}

    $('table').each((_, table) => {
        const rows = $(table).find('tr').toArray()
        if (rows.length < 2) return

        const headerCells = $(rows[0])
            .find('th, td')
            .toArray()
            .map((c) => $(c).text().replace(/\s+/g, ' ').trim())

        if (!/^year$/i.test(headerCells[0] ?? '')) return

        const years: number[] = []
        for (let i = 1; i < headerCells.length; i++) {
            const y = Number(headerCells[i])
            if (Number.isInteger(y) && y >= 2000 && y <= 2100) years.push(y)
            else years.push(NaN)
        }
        if (!years.some((y) => Number.isFinite(y))) return

        for (const year of years) {
            if (!Number.isFinite(year)) continue
            const key = String(year)
            if (!byYear[key]) {
                byYear[key] = { dps: null, eps: null, dividendYieldPct: null }
            }
        }

        for (let r = 1; r < rows.length; r++) {
            const cells = $(rows[r])
                .find('th, td')
                .toArray()
                .map((c) => $(c).text().replace(/\s+/g, ' ').trim())
            const label = normalizeRowLabel(cells[0] ?? '')
            if (!label) continue

            const isDps = /dividend\s+per\s+share/.test(label)
            const isEps = /net\s+earnings\s+per\s+share|earnings\s+per\s+share|\(eps\)/.test(label)
            const isYield = /dividend\s+yield/.test(label)
            if (!isDps && !isEps && !isYield) continue

            for (let i = 0; i < years.length; i++) {
                const year = years[i]
                if (!Number.isFinite(year)) continue
                const key = String(year)
                const value = parseMseRatioNumber(cells[i + 1] ?? '')
                if (value === null) continue
                const slot = byYear[key] ?? { dps: null, eps: null, dividendYieldPct: null }
                if (isDps) slot.dps = value
                else if (isEps) slot.eps = value
                else if (isYield) slot.dividendYieldPct = value
                byYear[key] = slot
            }
        }
    })

    // Drop years with no useful fields
    for (const key of Object.keys(byYear)) {
        const y = byYear[key]
        if (y.dps === null && y.eps === null && y.dividendYieldPct === null) {
            delete byYear[key]
        }
    }

    return byYear
}

export function loadMseSymbolRatiosFile(
    dataDir = path.join(process.cwd(), 'lib', 'data')
): MseSymbolRatiosFile | null {
    const filePath = path.join(dataDir, 'mse_symbol_ratios.json')
    if (!fs.existsSync(filePath)) return null
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8')) as MseSymbolRatiosFile
    } catch {
        return null
    }
}

function issuerNameMap(
    dataDir = path.join(process.cwd(), 'lib', 'data')
): Map<string, string> {
    const issuersPath = path.join(dataDir, 'issuers.json')
    const map = new Map<string, string>()
    if (!fs.existsSync(issuersPath)) return map
    try {
        const rows = JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as Array<{
            code: string
            name: string
        }>
        for (const row of rows) map.set(row.code.toUpperCase(), row.name)
    } catch {
        // ignore
    }
    return map
}

/**
 * Fill missing gross DPS from MSE Fin.Ratios; never overwrite non-null SECnet gross
 * unless it is OCR-derived and mismatches MSE (caller can pass allowOcrOverwrite).
 * Creates synthetic partial rows when no calendar exists for that profit year.
 * Does not re-label SECNet document rows as source=MSE — uses sourceFields instead.
 */
export function applyMseDividendRatios(
    entries: DividendCalendarEntry[],
    ratios: MseSymbolRatiosFile,
    options?: { dataDir?: string; allowOcrOverwrite?: boolean }
): { filled: number; created: number; overwritten: number } {
    const names = issuerNameMap(options?.dataDir)
    let filled = 0
    let created = 0
    let overwritten = 0

    for (const [code, issuer] of Object.entries(ratios.byCode)) {
        const stockCode = code.toUpperCase()
        for (const [yearStr, yearRatios] of Object.entries(issuer.years)) {
            const profitYear = Number(yearStr)
            if (!Number.isInteger(profitYear) || yearRatios.dps === null) continue

            const matches = entries.filter(
                (e) =>
                    e.stockCode.toUpperCase() === stockCode &&
                    resolveProfitYear(e) === profitYear
            )

            const withGross = matches.filter((e) => e.grossPerShare !== null)
            if (withGross.length > 0) {
                if (options?.allowOcrOverwrite) {
                    for (const target of withGross) {
                        if (target.source === 'manual') continue
                        if (target.sourceFields?.grossPerShare === 'MSE') continue
                        // Only overwrite when gross clearly mismatches MSE (OCR noise)
                        const tol = Math.max(Math.abs(yearRatios.dps) * 0.01, 0.01)
                        if (Math.abs((target.grossPerShare ?? 0) - yearRatios.dps) <= tol) continue
                        // Heuristic: OCR-ish = no payment dates and partial, or already MSE-filled field
                        const looksOcrPartial =
                            target.parseStatus === 'partial' &&
                            !target.paymentStart &&
                            !target.paymentEnd
                        if (!looksOcrPartial) continue
                        console.log(
                            `Dividend MSE overwrite: ${stockCode} FY${profitYear} gross ${target.grossPerShare} → ${yearRatios.dps}`
                        )
                        target.grossPerShare = yearRatios.dps
                        target.sourceFields = {
                            ...target.sourceFields,
                            grossPerShare: 'MSE',
                        }
                        overwritten++
                    }
                }
                continue
            }

            if (matches.length > 0) {
                const target = [...matches].sort((a, b) => b.filedAt.localeCompare(a.filedAt))[0]
                target.grossPerShare = yearRatios.dps
                if (target.parseStatus === 'link_only') target.parseStatus = 'partial'
                target.sourceFields = {
                    ...target.sourceFields,
                    grossPerShare: 'MSE',
                }
                // Keep entry.source as SECNet when this is a real SECNet document URL
                if (target.source !== 'manual' && !/seinet\.com\.mk/i.test(target.url)) {
                    target.source = 'MSE'
                }
                if (target.profitYear === null) target.profitYear = profitYear
                filled++
                continue
            }

            entries.push({
                stockCode,
                stockName: names.get(stockCode) ?? stockCode,
                filedAt: `${profitYear}-12-31`,
                url: mseSymbolPageUrl(stockCode, profitYear),
                grossPerShare: yearRatios.dps,
                cumDate: null,
                exDate: null,
                recordDate: null,
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'partial',
                source: 'MSE',
                sourceFields: { grossPerShare: 'MSE' },
                isSynthetic: true,
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear,
                payoutRatioPct: null,
            })
            created++
        }
    }

    return { filled, created, overwritten }
}

/**
 * Fill missing EPS from MSE Fin.Ratios; never overwrite non-null SECnet EPS.
 */
export function applyMseFundamentalsEps(
    entries: FundamentalEntry[],
    ratios: MseSymbolRatiosFile,
    options?: { dataDir?: string }
): { filled: number; created: number } {
    const names = issuerNameMap(options?.dataDir)
    let filled = 0
    let created = 0

    for (const [code, issuer] of Object.entries(ratios.byCode)) {
        const stockCode = code.toUpperCase()
        for (const [yearStr, yearRatios] of Object.entries(issuer.years)) {
            const fiscalYear = Number(yearStr)
            if (!Number.isInteger(fiscalYear) || yearRatios.eps === null) continue

            const matches = entries.filter(
                (e) => e.stockCode.toUpperCase() === stockCode && e.fiscalYear === fiscalYear
            )

            const withEps = matches.filter((e) => e.eps !== null)
            if (withEps.length > 0) continue

            if (matches.length > 0) {
                const target = [...matches].sort((a, b) => b.filedAt.localeCompare(a.filedAt))[0]
                target.eps = yearRatios.eps
                if (target.parseStatus === 'link_only') {
                    target.parseStatus = target.netProfit !== null ? 'parsed' : 'partial'
                } else if (target.parseStatus === 'partial' && target.netProfit !== null) {
                    target.parseStatus = 'parsed'
                }
                if (target.source !== 'manual') target.source = 'MSE'
                filled++
                continue
            }

            entries.push({
                stockCode,
                stockName: names.get(stockCode) ?? stockCode,
                fiscalYear,
                filedAt: `${fiscalYear}-12-31`,
                url: mseSymbolPageUrl(stockCode, fiscalYear),
                netProfit: null,
                eps: yearRatios.eps,
                parseStatus: 'partial',
                source: 'MSE',
            })
            created++
        }
    }

    return { filled, created }
}

export interface DividendOverrideRow {
    stock_code: string
    profit_year: number
    fields: {
        grossPerShare?: number | null
        cumDate?: string | null
        exDate?: string | null
        recordDate?: string | null
        paymentStart?: string | null
        paymentEnd?: string | null
        parseStatus?: DividendCalendarEntry['parseStatus']
    }
}

/** Apply manual overrides last — highest priority for overlapping fields. */
export function applyDividendOverrides(
    entries: DividendCalendarEntry[],
    overrides: DividendOverrideRow[],
    options?: { dataDir?: string }
): number {
    const names = issuerNameMap(options?.dataDir)
    let applied = 0

    for (const row of overrides) {
        const stockCode = row.stock_code.toUpperCase()
        const profitYear = row.profit_year
        const fields = row.fields ?? {}

        const matches = entries.filter(
            (e) =>
                e.stockCode.toUpperCase() === stockCode && resolveProfitYear(e) === profitYear
        )

        let target =
            matches.length > 0
                ? [...matches].sort((a, b) => b.filedAt.localeCompare(a.filedAt))[0]
                : null

        if (!target) {
            target = {
                stockCode,
                stockName: names.get(stockCode) ?? stockCode,
                filedAt: `${profitYear}-12-31`,
                url: mseSymbolPageUrl(stockCode, profitYear),
                grossPerShare: null,
                cumDate: null,
                exDate: null,
                recordDate: null,
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'partial',
                source: 'manual',
                sourceFields: {},
                isSynthetic: true,
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear,
                payoutRatioPct: null,
            }
            entries.push(target)
        }

        if ('grossPerShare' in fields) {
            target.grossPerShare = fields.grossPerShare ?? null
            target.sourceFields = { ...target.sourceFields, grossPerShare: 'manual' }
        }
        if ('cumDate' in fields) target.cumDate = fields.cumDate ?? null
        if ('exDate' in fields) target.exDate = fields.exDate ?? null
        if ('recordDate' in fields) target.recordDate = fields.recordDate ?? null
        if ('paymentStart' in fields) target.paymentStart = fields.paymentStart ?? null
        if ('paymentEnd' in fields) target.paymentEnd = fields.paymentEnd ?? null
        if (fields.parseStatus) target.parseStatus = fields.parseStatus
        else if (target.grossPerShare !== null && target.parseStatus === 'link_only') {
            target.parseStatus = 'partial'
        }
        target.source = 'manual'
        target.profitYear = profitYear
        applied++
    }

    return applied
}

/** True when entry is a synthetic MSE/manual row (no real SECNet filing). */
export function isSyntheticDividendEntry(entry: DividendCalendarEntry): boolean {
    if (entry.isSynthetic) return true
    if (entry.source === 'MSE' && /mse\.mk\/en\/symbol/i.test(entry.url)) return true
    if (entry.source === 'manual' && /mse\.mk\/en\/symbol/i.test(entry.url)) return true
    return false
}
