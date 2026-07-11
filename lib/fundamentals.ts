import { parseAmountMk } from './dividends'
import { inferPeriodYear, parseReportPeriod } from './results-calendar'

export const FUNDAMENTAL_PARSER_VERSION = '1.0.0'
/** Same field extractors as annual FY; versioned separately for quarterly/H1 ingest. */
export const RESULTS_PARSER_VERSION = '1.0.0'

export type FundamentalParseStatus = 'parsed' | 'partial' | 'link_only'

export interface FundamentalEntry {
    stockCode: string
    stockName: string
    fiscalYear: number
    filedAt: string
    url: string
    netProfit: number | null
    eps: number | null
    parseStatus: FundamentalParseStatus
    source: 'SECNet'
}

export interface FundamentalsFile {
    generatedAt: string
    all: FundamentalEntry[]
    byIssuer: Record<string, FundamentalEntry[]>
}

/** Annual P&L / audited FY filings suitable for payout-ratio EPS join. */
export function isAnnualFundamentalTitle(rawTitle: string): boolean {
    const lower = rawTitle.toLowerCase()
    if (lower.includes('dividend')) return false

    const period = parseReportPeriod(rawTitle)
    if (period?.endMonth === 12 && period.endDay === 31) return true

    if (lower.includes('audited financial')) return true
    if (lower.includes('annual report')) return true

    return false
}

export function inferFiscalYearFromTitle(rawTitle: string, filedAt: string): number | null {
    const period = parseReportPeriod(rawTitle)
    if (period) {
        return inferPeriodYear(period.endMonth, period.endDay, filedAt)
    }

    if (/audited financial/i.test(rawTitle)) {
        const filedYear = Number(filedAt.slice(0, 4))
        const filedMonth = Number(filedAt.slice(5, 7))
        if (!Number.isFinite(filedYear)) return null
        return filedMonth <= 6 ? filedYear - 1 : filedYear
    }

    return null
}

function firstMatch(text: string, patterns: RegExp[]): RegExpMatchArray | null {
    for (const pattern of patterns) {
        const m = text.match(pattern)
        if (m) return m
    }
    return null
}

export function deriveFundamentalParseStatus(fields: {
    netProfit: number | null
    eps: number | null
}): FundamentalParseStatus {
    if (fields.eps !== null) return 'parsed'
    if (fields.netProfit !== null) return 'partial'
    return 'link_only'
}

/** Parse net profit and EPS from annual report / P&L attachment text. */
export function parseFundamentalText(text: string): Pick<
    FundamentalEntry,
    'netProfit' | 'eps' | 'parseStatus'
> {
    const normalized = text.replace(/\s+/g, ' ').trim()

    let netProfit: number | null = null
    const profitMatch = firstMatch(normalized, [
        /profit for the (?:financial )?year(?: attributable to equity holders)?[^0-9]{0,40}([\d\s.,()-]+)/i,
        /net profit for the year[^0-9]{0,40}([\d\s.,()-]+)/i,
        /profit for the period[^0-9]{0,40}([\d\s.,()-]+)/i,
        /total comprehensive income for the year[^0-9]{0,40}([\d\s.,()-]+)/i,
        /вкупна добивка за годината[^0-9]{0,40}([\d\s.,()-]+)/i,
        /нето добивка за годината[^0-9]{0,40}([\d\s.,()-]+)/i,
        /добивка за годината[^0-9]{0,40}([\d\s.,()-]+)/i,
    ])
    if (profitMatch) {
        const raw = profitMatch[1].replace(/[()]/g, '').trim()
        netProfit = parseAmountMk(raw)
    }

    let eps: number | null = null
    const epsMatch = firstMatch(normalized, [
        /basic (?:and diluted )?earnings per share[^0-9]{0,30}([\d\s.,]+)/i,
        /earnings per share[^0-9]{0,30}([\d\s.,]+)/i,
        /eps[^0-9]{0,20}([\d\s.,]+)/i,
        /добивка по акција[^0-9]{0,30}([\d\s.,]+)/i,
        /основна добивка по акција[^0-9]{0,30}([\d\s.,]+)/i,
    ])
    if (epsMatch) eps = parseAmountMk(epsMatch[1])

    const parseStatus = deriveFundamentalParseStatus({ netProfit, eps })

    return { netProfit, eps, parseStatus }
}

export function buildFundamentalsFile(entries: FundamentalEntry[]): FundamentalsFile {
    const byIssuer: Record<string, FundamentalEntry[]> = {}
    for (const entry of entries) {
        if (!byIssuer[entry.stockCode]) byIssuer[entry.stockCode] = []
        byIssuer[entry.stockCode].push(entry)
    }
    for (const code of Object.keys(byIssuer)) {
        byIssuer[code].sort((a, b) => b.fiscalYear - a.fiscalYear)
    }

    return {
        generatedAt: new Date().toISOString(),
        all: [...entries].sort((a, b) => b.filedAt.localeCompare(a.filedAt)),
        byIssuer,
    }
}

/** Map of `${stockCode}:${fiscalYear}` → EPS for parsed entries. */
export function buildEpsIndex(entries: FundamentalEntry[]): Map<string, number> {
    const index = new Map<string, number>()
    for (const entry of entries) {
        if (entry.parseStatus !== 'parsed' || entry.eps === null) continue
        index.set(`${entry.stockCode}:${entry.fiscalYear}`, entry.eps)
    }
    return index
}
