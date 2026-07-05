/**
 * Prebuild: dividend calendars from issuer SECNet disclosure links + layoutLink backfill.
 * Output: lib/data/derived_dividends.json
 *
 * Set TALIR_PARSE_DIVIDENDS=1 to fetch SEInet attachments (PDF/HTML) and parse fields.
 * Set TALIR_OCR_DIVIDENDS=1 to OCR scanned PDF attachments (partial parseStatus only).
 */
import fs from 'fs'
import path from 'path'
import { loadOcrCache, saveOcrCache } from '../lib/dividend-ocr'
import { parseReportDate } from '../lib/news-dates'
import {
    buildDividendsCalendarFile,
    enrichDividendDerivedMetrics,
    enrichDividendPayoutRatios,
    isDividendCalendarTitle,
    parseDividendCalendarText,
    type EodPriceRow,
} from '../lib/dividends'
import { buildEpsIndex, type FundamentalEntry } from '../lib/fundamentals'
import type { DividendCalendarEntry } from '../lib/dividends'
import {
    fetchDividendDocumentText,
    parseDocumentIdFromUrl,
    walkDividendCalendarChain,
    type SeinetCalendarMeta,
} from '../lib/seinet-document'

const dataDir = path.join(process.cwd(), 'lib', 'data')
const issuersPath = path.join(dataDir, 'issuers.json')
const feedPath = path.join(dataDir, 'news_feed.json')
const stocksDir = path.join(dataDir, 'stocks')
const outPath = path.join(dataDir, 'derived_dividends.json')
const fundamentalsPath = path.join(dataDir, 'derived_fundamentals.json')

const historyCache = new Map<string, EodPriceRow[] | null>()

function loadStockHistory(stockCode: string): EodPriceRow[] | null {
    if (historyCache.has(stockCode)) return historyCache.get(stockCode) ?? null
    const filePath = path.join(stocksDir, `${stockCode}.json`)
    if (!fs.existsSync(filePath)) {
        historyCache.set(stockCode, null)
        return null
    }
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
            history?: EodPriceRow[]
        }
        const history = Array.isArray(raw.history) ? raw.history : null
        historyCache.set(stockCode, history)
        return history
    } catch {
        historyCache.set(stockCode, null)
        return null
    }
}

interface ReportLink {
    title: string
    url: string
    date?: string
}

interface IssuerRow {
    code: string
    name: string
    reportLinks?: ReportLink[]
    disclosureLinks?: ReportLink[]
}

function normalizeUrl(url: string | undefined): string | null {
    if (!url?.trim()) return null
    const trimmed = url.trim()
    if (trimmed.startsWith('http')) return trimmed
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    return `https://${trimmed}`
}

function filedAtFromTitle(title: string, dateField?: string): string | null {
    return parseReportDate(title, dateField ?? undefined)
}

function emptyCalendarFields(): Pick<
    DividendCalendarEntry,
    | 'grossPerShare'
    | 'cumDate'
    | 'exDate'
    | 'recordDate'
    | 'paymentStart'
    | 'paymentEnd'
    | 'parseStatus'
    | 'trailingYieldAtEx'
    | 'yoyGrowthPct'
    | 'profitYear'
    | 'payoutRatioPct'
> {
    return {
        grossPerShare: null,
        cumDate: null,
        exDate: null,
        recordDate: null,
        paymentStart: null,
        paymentEnd: null,
        parseStatus: 'link_only',
        trailingYieldAtEx: null,
        yoyGrowthPct: null,
        profitYear: null,
        payoutRatioPct: null,
    }
}

function loadEpsIndex(): Map<string, number> {
    if (!fs.existsSync(fundamentalsPath)) return new Map()
    try {
        const raw = JSON.parse(fs.readFileSync(fundamentalsPath, 'utf8')) as {
            all: FundamentalEntry[]
        }
        return buildEpsIndex(raw.all ?? [])
    } catch {
        return new Map()
    }
}

function buildEntryFromLink(issuer: IssuerRow, link: ReportLink): DividendCalendarEntry | null {
    if (!isDividendCalendarTitle(link.title)) return null
    const url = normalizeUrl(link.url)
    const filedAt = filedAtFromTitle(link.title, link.date)
    if (!url || !filedAt) return null

    return {
        stockCode: issuer.code,
        stockName: issuer.name,
        filedAt,
        url,
        ...emptyCalendarFields(),
        source: 'SECNet',
    }
}

function buildEntryFromChainMeta(meta: SeinetCalendarMeta, issuerNames: Map<string, string>): DividendCalendarEntry {
    return {
        stockCode: meta.stockCode,
        stockName: issuerNames.get(meta.stockCode) ?? meta.stockName,
        filedAt: meta.filedAt,
        url: meta.url,
        ...emptyCalendarFields(),
        source: 'SECNet',
    }
}

function mergeEntries(primary: DividendCalendarEntry[], extra: DividendCalendarEntry[]): DividendCalendarEntry[] {
    const byDocId = new Map<string, DividendCalendarEntry>()

    for (const entry of [...primary, ...extra]) {
        const docId = parseDocumentIdFromUrl(entry.url)
        const key = docId ? String(docId) : entry.url.toLowerCase()
        if (!byDocId.has(key)) {
            byDocId.set(key, entry)
        }
    }

    return Array.from(byDocId.values())
}

async function backfillFromLayoutChain(
    seeds: DividendCalendarEntry[],
    issuerNames: Map<string, string>
): Promise<DividendCalendarEntry[]> {
    const startId = seeds
        .map((entry) => parseDocumentIdFromUrl(entry.url))
        .find((id): id is number => id !== null)

    if (!startId) return seeds

    console.log(`Dividend backfill: walking layoutLink chain from document ${startId}…`)
    const chain = await walkDividendCalendarChain(startId)
    const chainEntries = chain.map((meta) => buildEntryFromChainMeta(meta, issuerNames))
    console.log(`Dividend backfill: ${chain.length} calendar documents in SECNet chain`)

    return mergeEntries(seeds, chainEntries)
}

async function enrichWithDocumentParse(entries: DividendCalendarEntry[]): Promise<void> {
    if (process.env.TALIR_PARSE_DIVIDENDS !== '1') return

    const allowOcr = process.env.TALIR_OCR_DIVIDENDS === '1'
    const ocrCache = allowOcr ? loadOcrCache() : {}

    let parsed = 0
    let partial = 0
    let linkOnly = 0

    for (const entry of entries) {
        const result = await fetchDividendDocumentText(entry.url, {
            allowOcr,
            ocrCache,
            persistOcrCache: false,
        })
        if (!result) {
            linkOnly++
            continue
        }

        const fields = parseDividendCalendarText(result.text, {
            fromOcr: result.source === 'ocr',
        })
        Object.assign(entry, fields)

        if (fields.parseStatus === 'parsed') parsed++
        else if (fields.parseStatus === 'partial') partial++
        else linkOnly++
    }

    if (allowOcr) {
        saveOcrCache(ocrCache)
    }

    console.log(
        `Dividend parse: ${parsed} parsed, ${partial} partial, ${linkOnly} link_only (of ${entries.length})`
    )
}

function collectFromIssuers(issuers: IssuerRow[]): DividendCalendarEntry[] {
    const byUrl = new Map<string, DividendCalendarEntry>()

    for (const issuer of issuers) {
        const links = [...(issuer.reportLinks ?? []), ...(issuer.disclosureLinks ?? [])]
        for (const link of links) {
            const entry = buildEntryFromLink(issuer, link)
            if (!entry) continue
            byUrl.set(entry.url.toLowerCase(), entry)
        }
    }

    return Array.from(byUrl.values())
}

function collectFromNewsFeed(): DividendCalendarEntry[] {
    if (!fs.existsSync(feedPath)) return []
    const feed = JSON.parse(fs.readFileSync(feedPath, 'utf8')) as {
        items: Array<{
            rawTitle?: string
            stockCode: string
            stockName?: string
            url: string
            publishedAt: string | null
            category: string
        }>
    }

    const entries: DividendCalendarEntry[] = []
    for (const item of feed.items) {
        const rawTitle = item.rawTitle ?? ''
        if (!isDividendCalendarTitle(rawTitle)) continue
        if (!item.publishedAt) continue
        entries.push({
            stockCode: item.stockCode,
            stockName: item.stockName ?? item.stockCode,
            filedAt: item.publishedAt,
            url: item.url,
            ...emptyCalendarFields(),
            source: 'SECNet',
        })
    }
    return entries
}

async function main(): Promise<void> {
    if (!fs.existsSync(issuersPath)) {
        console.error(`Missing ${issuersPath}. Run npm run script:issuers first.`)
        process.exit(1)
    }

    const issuers = JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as IssuerRow[]
    const issuerNames = new Map(issuers.map((issuer) => [issuer.code, issuer.name]))

    let entries = collectFromIssuers(issuers)

    if (!entries.length) {
        entries = collectFromNewsFeed()
    }

    entries = await backfillFromLayoutChain(entries, issuerNames)

    await enrichWithDocumentParse(entries)

    enrichDividendDerivedMetrics(entries, loadStockHistory)
    const withYield = entries.filter((e) => e.trailingYieldAtEx !== null).length

    enrichDividendPayoutRatios(entries, loadEpsIndex())
    const withPayout = entries.filter((e) => e.payoutRatioPct !== null).length

    console.log(`Dividend derived metrics: ${withYield} entries with trailing yield at ex`)
    console.log(`Dividend payout ratios: ${withPayout} entries with EPS-matched payout ratio`)

    entries.sort((a, b) => b.filedAt.localeCompare(a.filedAt))

    const issuerStat = fs.statSync(issuersPath)
    const lastIssuerScan = issuerStat.mtime.toISOString().split('T')[0]

    const payload = buildDividendsCalendarFile(entries, {
        lastIssuerScan,
        issuerCount: issuers.length,
    })

    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
    console.log(
        `Wrote dividends calendar: ${payload.all.length} total, ${payload.recent.length} recent, ${payload.upcomingExDates.length} upcoming ex-dates, ${Object.keys(payload.byIssuer).length} issuers → ${outPath}`
    )
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
