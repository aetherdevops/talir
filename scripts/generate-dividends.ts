/**
 * Prebuild: dividend calendars from issuer SECNet disclosure links + layoutLink backfill.
 * Output: lib/data/derived_dividends.json
 *
 * Set TALIR_PARSE_DIVIDENDS=1 to fetch SEInet attachments (PDF/HTML) and parse fields.
 * Set TALIR_OCR_DIVIDENDS=1 to OCR scanned PDF attachments (partial parseStatus only).
 * Set TALIR_DOCUMENT_STORE=supabase to merge parsed fields from Supabase ingest.
 * Set TALIR_DIVIDENDS_OFFLINE=1 (or omit TALIR_PARSE_DIVIDENDS outside CI) to skip
 * SEInet discovery and re-enrich the committed derived_dividends.json.
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
import { validateDividendEntries } from '../lib/dividend-validate'
import {
    clearFetchFailure,
    recordFetchFailure,
    shouldSkipFailedFetch,
} from '../lib/dividend-fetch-failures'
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
    preserved: Map<string, ParsedFieldSnapshot>,
    storeMergedKeys: Set<string>
): number {
    let restored = 0
    for (const entry of entries) {
        const key = entryDocKey(entry.url)
        // Store extraction always wins — including downgrade parsed → partial
        if (storeMergedKeys.has(key)) continue
        const snapshot = preserved.get(key)
        if (!snapshot) continue
        // Never clobber a better live parse with a stale derived row.
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
    if (entry.grossPerShare != null) {
        entry.sourceFields = { ...entry.sourceFields, grossPerShare: 'SECNet' }
    }
}

async function mergeFromDocumentStore(
    entries: DividendCalendarEntry[]
): Promise<{ merged: number; keys: Set<string> }> {
    const stored = await loadDividendExtractionsFromStore(DIVIDEND_PARSER_VERSION)
    const keys = new Set<string>()
    let merged = 0

    for (const entry of entries) {
        const docId = parseDocumentIdFromUrl(entry.url)
        if (!docId) continue
        const row = stored.get(docId)
        if (!row) continue
        applyStoredExtraction(entry, row.fields, row.parse_status)
        keys.add(entryDocKey(entry.url))
        merged++
    }

    return { merged, keys }
}

async function enrichWithDocumentParse(entries: DividendCalendarEntry[]): Promise<void> {
    if (process.env.TALIR_PARSE_DIVIDENDS !== '1') return

    const allowOcr = process.env.TALIR_OCR_DIVIDENDS === '1'
    const ocrCodes = process.env.TALIR_OCR_DIVIDEND_CODES?.split(',')
        .map((code) => code.trim().toUpperCase())
        .filter(Boolean)
    const mseRatios = loadMseSymbolRatiosFile(dataDir)

    let parsed = 0
    let partial = 0
    let linkOnly = 0
    let ocrAttempted = 0

    for (const entry of entries) {
        if (entry.parseStatus !== 'link_only') continue

        const docKey = entryDocKey(entry.url)
        if (shouldSkipFailedFetch(docKey)) {
            linkOnly++
            continue
        }

        const shouldOcr =
            allowOcr && (!ocrCodes?.length || ocrCodes.includes(entry.stockCode.toUpperCase()))

        const documentId = parseDocumentIdFromUrl(entry.url) ?? undefined
        const result = await fetchDividendDocumentText(entry.url, {
            allowOcr: shouldOcr,
            documentId,
        })
        if (result?.source === 'ocr') ocrAttempted++

        if (!result) {
            recordFetchFailure(docKey, 'fetch_or_extract_failed')
            linkOnly++
            continue
        }

        clearFetchFailure(docKey)

        let fields = parseDividendCalendarText(result.text, {
            fromOcr: result.source === 'ocr',
            filedAt: entry.filedAt,
        })
        const year = fields.profitYear
        const mseDps =
            year != null
                ? (mseRatios?.byCode[entry.stockCode.toUpperCase()]?.years[String(year)]?.dps ??
                  null)
                : null
        if (mseDps != null && result.source === 'ocr') {
            fields = parseDividendCalendarText(result.text, {
                fromOcr: true,
                filedAt: entry.filedAt,
                mseDps,
            })
        }
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
    const offline =
        process.env.TALIR_DIVIDENDS_OFFLINE === '1' ||
        (process.env.TALIR_PARSE_DIVIDENDS !== '1' &&
            process.env.TALIR_FORCE_DIVIDEND_DISCOVERY !== '1' &&
            fs.existsSync(outPath))

    if (offline && fs.existsSync(outPath)) {
        console.log(
            `Dividend offline mode: re-enriching committed ${outPath} (skip SEInet discovery walk)`
        )
        const existing = JSON.parse(fs.readFileSync(outPath, 'utf8')) as {
            all: DividendCalendarEntry[]
            lastIssuerScan: string | null
            issuerCount: number
        }
        const entries = existing.all ?? []

        const mseRatios = loadMseSymbolRatiosFile(dataDir)
        if (mseRatios) {
            applyMseDividendRatios(entries, mseRatios, { dataDir, allowOcrOverwrite: true })
        }

        const overrides = await loadDividendOverrides()
        if (overrides.length > 0) {
            const applied = applyDividendOverrides(entries, overrides, { dataDir })
            console.log(`Dividend overrides: applied ${applied} manual rows`)
        }

        enrichDividendDerivedMetrics(entries, loadStockHistory)
        enrichDividendPayoutRatios(entries, loadEpsIndex())

        const validation = validateDividendEntries(entries, { mseRatios })
        fs.writeFileSync(
            path.join(dataDir, 'derived_dividend_validation.json'),
            JSON.stringify(validation, null, 2)
        )
        if (validation.issueCount > 0) {
            enrichDividendDerivedMetrics(entries, loadStockHistory)
            enrichDividendPayoutRatios(entries, loadEpsIndex())
        }

        entries.sort((a, b) => b.filedAt.localeCompare(a.filedAt))
        const payload = buildDividendsCalendarFile(entries, {
            lastIssuerScan: existing.lastIssuerScan,
            issuerCount: existing.issuerCount,
        })
        fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
        console.log(
            `Wrote dividends calendar (offline): ${payload.all.length} total, ${payload.upcomingExDates.length} upcoming → ${outPath}`
        )
        return
    }

    if (!fs.existsSync(issuersPath)) {
        console.error(`Missing ${issuersPath}. Run npm run script:issuers first.`)
        process.exit(1)
    }

    const { entries, issuers } = await discoverAllDividendCalendars()

    const preservedParsed =
        process.env.TALIR_PARSE_DIVIDENDS === '1' && !isDocumentStoreEnabled()
            ? new Map<string, ParsedFieldSnapshot>()
            : loadExistingParsedFields()

    let storeMergedKeys = new Set<string>()
    if (isDocumentStoreEnabled()) {
        const { merged, keys } = await mergeFromDocumentStore(entries)
        storeMergedKeys = keys
        console.log(`Dividend store: merged ${merged} extractions from Supabase`)
    }

    await enrichWithDocumentParse(entries)

    if (preservedParsed.size > 0) {
        const restored = restoreParsedFields(entries, preservedParsed, storeMergedKeys)
        console.log(`Dividend preserve: restored parsed fields for ${restored} entries from existing ${outPath}`)
    }

    const mseRatios = loadMseSymbolRatiosFile(dataDir)
    if (mseRatios) {
        const { filled, created, overwritten } = applyMseDividendRatios(entries, mseRatios, {
            dataDir,
            allowOcrOverwrite: true,
        })
        console.log(
            `Dividend MSE ratios: filled ${filled} gaps, created ${created} synthetic, overwritten ${overwritten} OCR mismatches from ${mseRatiosPath}`
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

    const validation = validateDividendEntries(entries, { mseRatios })
    const validationPath = path.join(dataDir, 'derived_dividend_validation.json')
    fs.writeFileSync(validationPath, JSON.stringify(validation, null, 2))
    console.log(
        `Dividend validation: ${validation.issueCount} issues → ${validationPath}`
    )

    // Re-enrich after validation may have cleared ex/cum fields
    if (validation.issueCount > 0) {
        enrichDividendDerivedMetrics(entries, loadStockHistory)
        enrichDividendPayoutRatios(entries, loadEpsIndex())
    }

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

function loadCommittedManualCorrections(): DividendOverrideRow[] {
    const correctionsPath = path.join(dataDir, 'dividend_manual_corrections.json')
    if (!fs.existsSync(correctionsPath)) return []
    try {
        const raw = JSON.parse(fs.readFileSync(correctionsPath, 'utf8')) as {
            overrides?: DividendOverrideRow[]
        }
        return Array.isArray(raw.overrides) ? raw.overrides : []
    } catch (err) {
        console.warn(
            'Dividend manual corrections load failed:',
            err instanceof Error ? err.message : err
        )
        return []
    }
}

async function loadDividendOverrides(): Promise<DividendOverrideRow[]> {
    const committed = loadCommittedManualCorrections()
    const db = getSupabaseAdminOrNull()
    if (!db) return committed
    try {
        const { data, error } = await db
            .from('dividend_overrides')
            .select('stock_code, profit_year, fields')
        if (error) {
            // Table may not exist yet — non-fatal
            if (!/dividend_overrides|schema cache|does not exist/i.test(error.message)) {
                console.warn('Dividend overrides load failed:', error.message)
            }
            return committed
        }
        // Supabase rows win over committed corrections for the same stock+year(+url).
        const byKey = new Map<string, DividendOverrideRow>()
        const overrideKey = (row: DividendOverrideRow) =>
            `${row.stock_code.toUpperCase()}:${row.profit_year}:${row.match_url ?? '*'}`
        for (const row of committed) {
            byKey.set(overrideKey(row), row)
        }
        for (const row of (data ?? []) as DividendOverrideRow[]) {
            byKey.set(overrideKey(row), row)
        }
        return [...byKey.values()]
    } catch {
        return committed
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
