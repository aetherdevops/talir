/**
 * Dividend coverage matrix: issuer × profitYear classified by data quality.
 * Used by report:dividends and admin coverage UI.
 */
import fs from 'fs'
import path from 'path'
import {
    DIVIDEND_PARSER_VERSION,
    resolveProfitYear,
    type DividendCalendarEntry,
    type DividendParseStatus,
    type DividendsCalendarFile,
} from './dividends'
import { loadMseSymbolRatiosFile, type MseSymbolRatiosFile } from './mse-symbol-ratios'
import {
    isDocumentStoreEnabled,
    loadDividendExtractionsFromStore,
} from './document-store'
import { getSupabaseAdminOrNull } from './supabase/admin'

export type CoverageCellKind =
    | 'parsed'
    | 'partial_dps_only'
    | 'partial'
    | 'link_only'
    | 'mse_only'
    | 'no_document'
    | 'override'

export interface CoverageCell {
    stockCode: string
    profitYear: number
    kind: CoverageCellKind
    source: DividendCalendarEntry['source'] | null
    parseStatus: DividendParseStatus | null
    grossPerShare: number | null
    exDate: string | null
    paymentStart: string | null
    paymentEnd: string | null
    url: string | null
    hasMseDps: boolean
    mseDps: number | null
    hasOverride: boolean
    hasSeinetDocument: boolean
}

export interface DividendCoverageReport {
    generatedAt: string
    parserVersion: string
    summary: Record<CoverageCellKind, number> & {
        totalCells: number
        withGross: number
        withEx: number
        withPayment: number
        issuers: number
        yearMin: number | null
        yearMax: number | null
    }
    cells: CoverageCell[]
    gaps: CoverageCell[]
}

function defaultDataDir(): string {
    return path.join(process.cwd(), 'lib', 'data')
}

function isSeinetDocumentUrl(url: string | null | undefined): boolean {
    return Boolean(url && /seinet\.com\.mk/i.test(url))
}

function classifyEntry(
    entry: DividendCalendarEntry,
    hasOverride: boolean
): CoverageCellKind {
    if (hasOverride) return 'override'

    const mseOnlyRow =
        (entry.source === 'MSE' || entry.isSynthetic === true) &&
        !isSeinetDocumentUrl(entry.url) &&
        entry.parseStatus !== 'parsed'

    if (mseOnlyRow) return 'mse_only'

    if (entry.parseStatus === 'parsed') return 'parsed'
    if (entry.parseStatus === 'link_only') return 'link_only'

    if (entry.grossPerShare !== null && !entry.exDate && !entry.cumDate && !entry.recordDate) {
        return 'partial_dps_only'
    }
    if (entry.parseStatus === 'partial') return 'partial'

    return 'no_document'
}

export function classifyCoverageCell(input: {
    stockCode: string
    profitYear: number
    entry: DividendCalendarEntry | null
    mseDps: number | null
    hasOverride: boolean
    hasSeinetDocument: boolean
}): CoverageCell {
    const { stockCode, profitYear, entry, mseDps, hasOverride, hasSeinetDocument } = input

    let kind: CoverageCellKind
    if (!entry) {
        if (hasOverride) kind = 'override'
        else if (mseDps !== null) kind = 'mse_only'
        else if (!hasSeinetDocument) kind = 'no_document'
        else kind = 'link_only'
    } else {
        kind = classifyEntry(entry, hasOverride)
    }

    return {
        stockCode,
        profitYear,
        kind,
        source: entry?.source ?? null,
        parseStatus: entry?.parseStatus ?? null,
        grossPerShare: entry?.grossPerShare ?? null,
        exDate: entry?.exDate ?? null,
        paymentStart: entry?.paymentStart ?? null,
        paymentEnd: entry?.paymentEnd ?? null,
        url: entry?.url ?? null,
        hasMseDps: mseDps !== null,
        mseDps,
        hasOverride,
        hasSeinetDocument,
    }
}

function emptySummary(): DividendCoverageReport['summary'] {
    return {
        parsed: 0,
        partial_dps_only: 0,
        partial: 0,
        link_only: 0,
        mse_only: 0,
        no_document: 0,
        override: 0,
        totalCells: 0,
        withGross: 0,
        withEx: 0,
        withPayment: 0,
        issuers: 0,
        yearMin: null,
        yearMax: null,
    }
}

export function buildCoverageReport(input: {
    entries: DividendCalendarEntry[]
    mseRatios: MseSymbolRatiosFile | null
    overrides: Set<string>
    seinetDocs: Set<string>
    parserVersion?: string
}): DividendCoverageReport {
    const cellKey = (code: string, year: number) => `${code.toUpperCase()}::${year}`
    const bestByKey = new Map<string, DividendCalendarEntry>()

    for (const entry of input.entries) {
        const year = resolveProfitYear(entry)
        if (year == null) continue
        const key = cellKey(entry.stockCode, year)
        const prev = bestByKey.get(key)
        if (!prev) {
            bestByKey.set(key, entry)
            continue
        }
        const rank = (e: DividendCalendarEntry) => {
            let s = e.parseStatus === 'parsed' ? 3 : e.parseStatus === 'partial' ? 2 : 0
            if (e.grossPerShare != null) s += 1
            if (e.source === 'SECNet') s += 1
            if (e.source === 'manual') s += 2
            return s
        }
        if (rank(entry) > rank(prev)) bestByKey.set(key, entry)
    }

    const keys = new Set<string>(bestByKey.keys())

    if (input.mseRatios) {
        for (const [code, issuer] of Object.entries(input.mseRatios.byCode)) {
            for (const [yearStr, ratios] of Object.entries(issuer.years)) {
                if (ratios.dps == null) continue
                const year = Number(yearStr)
                if (!Number.isInteger(year)) continue
                keys.add(cellKey(code, year))
            }
        }
    }

    for (const key of input.overrides) keys.add(key)
    for (const key of input.seinetDocs) keys.add(key)

    const cells: CoverageCell[] = []
    for (const key of keys) {
        const [stockCode, yearStr] = key.split('::')
        const profitYear = Number(yearStr)
        if (!stockCode || !Number.isInteger(profitYear)) continue

        const entry = bestByKey.get(key) ?? null
        const mseDps = input.mseRatios?.byCode[stockCode]?.years[String(profitYear)]?.dps ?? null
        const hasOverride = input.overrides.has(key)
        const hasSeinetDocument =
            input.seinetDocs.has(key) || (entry?.source === 'SECNet' && Boolean(entry.url))

        cells.push(
            classifyCoverageCell({
                stockCode,
                profitYear,
                entry,
                mseDps,
                hasOverride,
                hasSeinetDocument,
            })
        )
    }

    cells.sort(
        (a, b) => a.stockCode.localeCompare(b.stockCode) || b.profitYear - a.profitYear
    )

    const summary = emptySummary()
    const issuers = new Set<string>()
    let yearMin: number | null = null
    let yearMax: number | null = null

    for (const cell of cells) {
        summary[cell.kind]++
        summary.totalCells++
        issuers.add(cell.stockCode)
        if (cell.grossPerShare != null) summary.withGross++
        if (cell.exDate) summary.withEx++
        if (cell.paymentStart || cell.paymentEnd) summary.withPayment++
        yearMin = yearMin == null ? cell.profitYear : Math.min(yearMin, cell.profitYear)
        yearMax = yearMax == null ? cell.profitYear : Math.max(yearMax, cell.profitYear)
    }

    summary.issuers = issuers.size
    summary.yearMin = yearMin
    summary.yearMax = yearMax

    const gaps = cells.filter(
        (c) =>
            c.kind === 'link_only' ||
            c.kind === 'mse_only' ||
            c.kind === 'no_document' ||
            c.kind === 'partial_dps_only'
    )

    return {
        generatedAt: new Date().toISOString(),
        parserVersion: input.parserVersion ?? DIVIDEND_PARSER_VERSION,
        summary,
        cells,
        gaps,
    }
}

export function loadDerivedDividendEntries(dataDir = defaultDataDir()): DividendCalendarEntry[] {
    const filePath = path.join(dataDir, 'derived_dividends.json')
    if (!fs.existsSync(filePath)) return []
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as DividendsCalendarFile
        return raw.all ?? []
    } catch {
        return []
    }
}

export async function loadOverrideKeys(): Promise<Set<string>> {
    const keys = new Set<string>()
    const db = getSupabaseAdminOrNull()
    if (!db) return keys
    try {
        const { data, error } = await db.from('dividend_overrides').select('stock_code, profit_year')
        if (error || !data) return keys
        for (const row of data) {
            keys.add(`${String(row.stock_code).toUpperCase()}::${row.profit_year}`)
        }
    } catch {
        // table may not exist
    }
    return keys
}

/** Keys for current SECnet dividend_calendar docs that have a profit_year. */
export async function loadSeinetDocKeys(
    parserVersion = DIVIDEND_PARSER_VERSION
): Promise<Set<string>> {
    const keys = new Set<string>()
    if (!isDocumentStoreEnabled()) return keys

    const stored = await loadDividendExtractionsFromStore(parserVersion)
    for (const row of stored.values()) {
        const fields = row.fields
        const py = typeof fields.profitYear === 'number' ? fields.profitYear : null
        if (py != null) {
            keys.add(`${row.stock_code.toUpperCase()}::${py}`)
        }
    }

    const db = getSupabaseAdminOrNull()
    if (!db) return keys
    try {
        const { data } = await db
            .from('seinet_documents')
            .select('stock_code, profit_year')
            .eq('document_kind', 'dividend_calendar')
            .eq('is_current', true)
            .not('profit_year', 'is', null)
        for (const row of data ?? []) {
            if (row.profit_year == null) continue
            keys.add(`${String(row.stock_code).toUpperCase()}::${row.profit_year}`)
        }
    } catch {
        // ignore
    }
    return keys
}

export async function generateDividendCoverageReport(
    dataDir = defaultDataDir()
): Promise<DividendCoverageReport> {
    const entries = loadDerivedDividendEntries(dataDir)
    const mseRatios = loadMseSymbolRatiosFile(dataDir)
    const overrides = await loadOverrideKeys()
    const seinetDocs = await loadSeinetDocKeys()
    return buildCoverageReport({
        entries,
        mseRatios,
        overrides,
        seinetDocs,
    })
}

export function writeCoverageReport(
    report: DividendCoverageReport,
    dataDir = defaultDataDir()
): string {
    const outPath = path.join(dataDir, 'derived_dividend_coverage.json')
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(report, null, 2))
    return outPath
}

export function formatCoverageConsole(report: DividendCoverageReport): string {
    const s = report.summary
    const lines = [
        `Dividend coverage · parser ${report.parserVersion}`,
        `  cells=${s.totalCells} issuers=${s.issuers} years=${s.yearMin ?? '—'}–${s.yearMax ?? '—'}`,
        `  parsed=${s.parsed} partial=${s.partial} partial_dps_only=${s.partial_dps_only} link_only=${s.link_only}`,
        `  mse_only=${s.mse_only} no_document=${s.no_document} override=${s.override}`,
        `  withGross=${s.withGross} withEx=${s.withEx} withPayment=${s.withPayment}`,
        `  gaps=${report.gaps.length}`,
    ]

    const gapPreview = report.gaps.slice(0, 25)
    if (gapPreview.length) {
        lines.push('  top gaps:')
        for (const g of gapPreview) {
            lines.push(
                `    ${g.stockCode} ${g.profitYear} · ${g.kind}` +
                    (g.hasMseDps ? ` · MSE DPS=${g.mseDps}` : '') +
                    (g.grossPerShare != null ? ` · DPS=${g.grossPerShare}` : '')
            )
        }
        if (report.gaps.length > gapPreview.length) {
            lines.push(`    … +${report.gaps.length - gapPreview.length} more`)
        }
    }

    return lines.join('\n')
}
