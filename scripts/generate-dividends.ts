/**
 * Prebuild: dividend calendars from issuer SECNet disclosure links + layoutLink backfill.
 * Output: lib/data/derived_dividends.json
 *
 * Set TALIR_PARSE_DIVIDENDS=1 to fetch SEInet attachments (PDF/HTML) and parse fields.
 * Set TALIR_OCR_DIVIDENDS=1 to OCR scanned PDF attachments (partial parseStatus only).
 * Set TALIR_DOCUMENT_STORE=supabase to merge parsed fields from Supabase ingest.
 */
import fs from 'fs'
import path from 'path'
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()
import {
    buildDividendsCalendarFile,
    DIVIDEND_PARSER_VERSION,
    enrichDividendDerivedMetrics,
    enrichDividendPayoutRatios,
    parseDividendCalendarText,
    type DividendCalendarEntry,
    type EodPriceRow,
} from '../lib/dividends'
import { buildEpsIndex, type FundamentalEntry } from '../lib/fundamentals'
import {
    defaultDataPaths,
    discoverAllDividendCalendars,
    entryDocKey,
} from '../lib/dividend-discovery'
import {
    isDocumentStoreEnabled,
    loadDividendExtractionsFromStore,
} from '../lib/document-store'
import { fetchDividendDocumentText, parseDocumentIdFromUrl } from '../lib/seinet-document'
import {
    applyDividendOverrides,
    applyMseDividendRatios,
    loadMseSymbolRatiosFile,
    type DividendOverrideRow,
} from '../lib/mse-symbol-ratios'
import { getSupabaseAdminOrNull } from '../lib/supabase/admin'

const { dataDir, issuersPath } = defaultDataPaths()
const stocksDir = path.join(dataDir, 'stocks')
const outPath = path.join(dataDir, 'derived_dividends.json')
const fundamentalsPath = path.join(dataDir, 'derived_fundamentals.json')
const mseRatiosPath = path.join(dataDir, 'mse_symbol_ratios.json')

const historyCache = new Map<string, EodPriceRow[] | null>()

function loadStockHistory(stockCode: string): EodPriceRow[] | null {
    if (historyCache.has(stockCode)) return historyCache.get(stockCode) ?? null
    const filePath = path.join(stocksDir, `${stockCode}.json`)
    if (!fs.existsSync(filePath)) {
        historyCache.set(stockCode, null)
        return null
    }
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { history?: EodPriceRow[] }
        const history = Array.isArray(raw.history) ? raw.history : null
        historyCache.set(stockCode, history)
        return history
    } catch {
        historyCache.set(stockCode, null)
        return null
    }
}

type ParsedFieldSnapshot = Pick<
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
>

function loadExistingParsedFields(): Map<string, ParsedFieldSnapshot> {
    if (!fs.existsSync(outPath)) return new Map()

    try {
        const existing = JSON.parse(fs.readFileSync(outPath, 'utf8')) as { all?: DividendCalendarEntry[] }
        const preserved = new Map<string, ParsedFieldSnapshot>()

        for (const entry of existing.all ?? []) {
            if (entry.parseStatus === 'link_only') continue
            preserved.set(entryDocKey(entry.url), {
                grossPerShare: entry.grossPerShare,
                cumDate: entry.cumDate,
                exDate: entry.exDate,
                recordDate: entry.recordDate,
                paymentStart: entry.paymentStart,
                paymentEnd: entry.paymentEnd,
                parseStatus: entry.parseStatus,
                trailingYieldAtEx: entry.trailingYieldAtEx,
                yoyGrowthPct: entry.yoyGrowthPct,
                profitYear: entry.profitYear,
                payoutRatioPct: entry.payoutRatioPct,
            })
        }

        return preserved
    } catch {
        return new Map()
    }
}

function parseQualityScore(fields: {
    parseStatus: DividendCalendarEntry['parseStatus']
    grossPerShare: number | null
}): number {
    let score = fields.parseStatus === 'parsed' ? 3 : fields.parseStatus === 'partial' ? 2 : 0
    if (fields.grossPerShare !== null) score += 1
    return score
}

function restoreParsedFields(
    entries: DividendCalendarEntry[],
    preserved: Map<string, ParsedFieldSnapshot>
): number {
    let restored = 0
    for (const entry of entries) {
        const snapshot = preserved.get(entryDocKey(entry.url))
        if (!snapshot) continue
        // Never clobber a better store/OCR parse with a stale derived row.
        if (parseQualityScore(snapshot) <= parseQualityScore(entry)) continue
        Object.assign(entry, snapshot)
        restored++
    }
    return restored
}

function applyStoredExtraction(
    entry: DividendCalendarEntry,
    fields: Record<string, unknown>,
    parseStatus: DividendCalendarEntry['parseStatus']
): void {
    entry.grossPerShare = (fields.grossPerShare as number | null) ?? null
    entry.cumDate = (fields.cumDate as string | null) ?? null
    entry.exDate = (fields.exDate as string | null) ?? null
    entry.recordDate = (fields.recordDate as string | null) ?? null
    entry.paymentStart = (fields.paymentStart as string | null) ?? null
    entry.paymentEnd = (fields.paymentEnd as string | null) ?? null
    entry.profitYear = (fields.profitYear as number | null) ?? null
    entry.parseStatus = parseStatus
}

async function mergeFromDocumentStore(entries: DividendCalendarEntry[]): Promise<number> {
    const stored = await loadDividendExtractionsFromStore(DIVIDEND_PARSER_VERSION)
    let merged = 0

    for (const entry of entries) {
        const docId = parseDocumentIdFromUrl(entry.url)
        if (!docId) continue
        const row = stored.get(docId)
        if (!row) continue
        applyStoredExtraction(entry, row.fields, row.parse_status)
        merged++
    }

    return merged
}

async function enrichWithDocumentParse(entries: DividendCalendarEntry[]): Promise<void> {
    if (process.env.TALIR_PARSE_DIVIDENDS !== '1') return

    const allowOcr = process.env.TALIR_OCR_DIVIDENDS === '1'
    const ocrCodes = process.env.TALIR_OCR_DIVIDEND_CODES?.split(',')
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean)

    let parsed = 0
    let partial = 0
    let linkOnly = 0
    let ocrAttempted = 0

    for (const entry of entries) {
        if (entry.parseStatus !== 'link_only') continue

        const shouldOcr =
            allowOcr && (!ocrCodes?.length || ocrCodes.includes(entry.stockCode.toUpperCase()))

        const documentId = parseDocumentIdFromUrl(entry.url) ?? undefined
        const result = await fetchDividendDocumentText(entry.url, {
            allowOcr: shouldOcr,
            documentId,
        })
        if (result?.source === 'ocr') ocrAttempted++

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
        console.log(`Dividend OCR: ${ocrAttempted} attachments OCR'd`)
    }

    console.log(
        `Dividend parse: ${parsed} parsed, ${partial} partial, ${linkOnly} link_only (of ${entries.length})`
    )
}

async function main(): Promise<void> {
    if (!fs.existsSync(issuersPath)) {
        console.error(`Missing ${issuersPath}. Run npm run script:issuers first.`)
        process.exit(1)
    }

    const { entries, issuers } = await discoverAllDividendCalendars()

    const preservedParsed =
        process.env.TALIR_PARSE_DIVIDENDS === '1' && !isDocumentStoreEnabled()
            ? new Map<string, ParsedFieldSnapshot>()
            : loadExistingParsedFields()

    if (isDocumentStoreEnabled()) {
        const merged = await mergeFromDocumentStore(entries)
        console.log(`Dividend store: merged ${merged} extractions from Supabase`)
    }

    await enrichWithDocumentParse(entries)

    if (preservedParsed.size > 0) {
        const restored = restoreParsedFields(entries, preservedParsed)
        console.log(`Dividend preserve: restored parsed fields for ${restored} entries from existing ${outPath}`)
    }

    const mseRatios = loadMseSymbolRatiosFile(dataDir)
    if (mseRatios) {
        const { filled, created } = applyMseDividendRatios(entries, mseRatios, { dataDir })
        console.log(
            `Dividend MSE ratios: filled ${filled} gaps, created ${created} synthetic rows from ${mseRatiosPath}`
        )
    } else {
        console.log(`Dividend MSE ratios: skipped (missing ${mseRatiosPath} — run npm run scrape:mse-ratios)`)
    }

    const overrides = await loadDividendOverrides()
    if (overrides.length > 0) {
        const applied = applyDividendOverrides(entries, overrides, { dataDir })
        console.log(`Dividend overrides: applied ${applied} manual rows`)
    }

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

function loadEpsIndex(): Map<string, number> {
    if (!fs.existsSync(fundamentalsPath)) return new Map()
    try {
        const raw = JSON.parse(fs.readFileSync(fundamentalsPath, 'utf8')) as { all: FundamentalEntry[] }
        return buildEpsIndex(raw.all ?? [])
    } catch {
        return new Map()
    }
}

async function loadDividendOverrides(): Promise<DividendOverrideRow[]> {
    const db = getSupabaseAdminOrNull()
    if (!db) return []
    try {
        const { data, error } = await db
            .from('dividend_overrides')
            .select('stock_code, profit_year, fields')
        if (error) {
            // Table may not exist yet — non-fatal
            if (!/dividend_overrides|schema cache|does not exist/i.test(error.message)) {
                console.warn('Dividend overrides load failed:', error.message)
            }
            return []
        }
        return (data ?? []) as DividendOverrideRow[]
    } catch {
        return []
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
