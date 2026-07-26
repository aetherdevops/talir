import type { DividendCalendarEntry } from './dividends'
import {
    earliestCalendarYear,
    hasAnalyticsCore,
    latestDisclosedDividend,
    latestParsedDividend,
    resolveProfitYear,
} from './dividends'
import { computeTrailingDividendYieldPct } from './stock-valuation'

export type PayoutHealth = 'conservative' | 'typical' | 'stretched'

export interface YieldAtExPoint {
    year: number
    yieldPct: number
}

export interface DividendScorecard {
    trailingYieldPct: number | null
    yieldAtExSeries: YieldAtExPoint[]
    yieldGrowthPct: number | null
    yoyDpsGrowthPct: number | null
    payoutRatioPct: number | null
    payoutHealth: PayoutHealth | null
    dividendStreakYears: number
    disclosedDividendCount: number
    calendarCount: number
    coverageSinceYear: number | null
    latestGrossPerShare: number | null
    latestProfitYear: number | null
    parseStatus: DividendCalendarEntry['parseStatus'] | null
    seinetSourceUrl: string
}

/** MSE issuer page lists all SECNet disclosure links for the company. */
export function issuerSeinetDisclosuresUrl(stockCode: string): string {
    return `https://www.mse.mk/en/symbol/${encodeURIComponent(stockCode)}`
}

export function classifyPayoutHealth(payoutRatioPct: number | null): PayoutHealth | null {
    if (payoutRatioPct === null) return null
    if (payoutRatioPct < 60) return 'conservative'
    if (payoutRatioPct <= 90) return 'typical'
    return 'stretched'
}

/**
 * One disclosed calendar per profit year with analytics core (gross + ex).
 * Newest filing wins.
 */
export function uniqueDisclosedByProfitYear(entries: DividendCalendarEntry[]): DividendCalendarEntry[] {
    const byYear = new Map<number, DividendCalendarEntry>()

    for (const entry of entries) {
        if (!hasAnalyticsCore(entry)) continue
        const year = resolveProfitYear(entry)
        if (!year) continue
        const existing = byYear.get(year)
        if (!existing || entry.filedAt > existing.filedAt) {
            byYear.set(year, entry)
        }
    }

    return [...byYear.values()].sort((a, b) => resolveProfitYear(a)! - resolveProfitYear(b)!)
}

/** @deprecated Use uniqueDisclosedByProfitYear — kept as alias for callers. */
export function uniqueParsedByProfitYear(entries: DividendCalendarEntry[]): DividendCalendarEntry[] {
    return uniqueDisclosedByProfitYear(entries)
}

export function computeDividendStreakYears(entries: DividendCalendarEntry[]): number {
    const years = uniqueDisclosedByProfitYear(entries)
        .filter((entry) => (entry.grossPerShare ?? 0) > 0)
        .map((entry) => resolveProfitYear(entry)!)
        .sort((a, b) => b - a)

    if (!years.length) return 0

    let streak = 1
    for (let i = 1; i < years.length; i++) {
        if (years[i] === years[i - 1]! - 1) streak++
        else break
    }
    return streak
}

export function countDisclosedDividends(
    entries: DividendCalendarEntry[],
    firstTradeDate: string | null = null
): number {
    const seenYears = new Set<number>()

    for (const entry of entries) {
        if (entry.parseStatus === 'link_only' || entry.grossPerShare === null || entry.grossPerShare <= 0) {
            continue
        }
        const eventDate = entry.exDate ?? entry.filedAt
        if (firstTradeDate && eventDate < firstTradeDate) continue
        const year = resolveProfitYear(entry) ?? Number(eventDate.slice(0, 4))
        seenYears.add(year)
    }

    return seenYears.size
}

export function buildYieldAtExSeries(entries: DividendCalendarEntry[], maxPoints = 8): YieldAtExPoint[] {
    return uniqueDisclosedByProfitYear(entries)
        .filter((entry) => entry.trailingYieldAtEx !== null)
        .map((entry) => ({
            year: resolveProfitYear(entry)!,
            yieldPct: entry.trailingYieldAtEx as number,
        }))
        .slice(-maxPoints)
}

export function computeYieldGrowthPct(series: YieldAtExPoint[]): number | null {
    if (series.length < 2) return null
    const latest = series[series.length - 1]!
    const prior = series[series.length - 2]!
    if (prior.yieldPct <= 0) return null
    return ((latest.yieldPct - prior.yieldPct) / prior.yieldPct) * 100
}

export function buildDividendScorecard(input: {
    stockCode: string
    entries: DividendCalendarEntry[]
    currentPrice?: number | null
    firstTradeDate?: string | null
}): DividendScorecard {
    const { stockCode, entries, currentPrice = null, firstTradeDate = null } = input
    const latestDisclosed = latestDisclosedDividend(entries)
    const latestParsed = latestParsedDividend(entries)
    const yieldAtExSeries = buildYieldAtExSeries(entries)

    const trailingYieldPct =
        currentPrice && latestDisclosed?.grossPerShare
            ? computeTrailingDividendYieldPct(currentPrice, latestDisclosed.grossPerShare)
            : latestDisclosed?.trailingYieldAtEx ?? latestParsed?.trailingYieldAtEx ?? null

    const payoutRatioPct =
        latestDisclosed?.payoutRatioPct ?? latestParsed?.payoutRatioPct ?? null

    return {
        trailingYieldPct,
        yieldAtExSeries,
        yieldGrowthPct: computeYieldGrowthPct(yieldAtExSeries),
        yoyDpsGrowthPct: latestDisclosed?.yoyGrowthPct ?? latestParsed?.yoyGrowthPct ?? null,
        payoutRatioPct,
        payoutHealth: classifyPayoutHealth(payoutRatioPct),
        dividendStreakYears: computeDividendStreakYears(entries),
        disclosedDividendCount: countDisclosedDividends(entries, firstTradeDate),
        calendarCount: entries.length,
        coverageSinceYear: earliestCalendarYear(entries),
        latestGrossPerShare: latestDisclosed?.grossPerShare ?? null,
        latestProfitYear: latestDisclosed ? resolveProfitYear(latestDisclosed) : null,
        parseStatus: latestDisclosed?.parseStatus ?? null,
        seinetSourceUrl: issuerSeinetDisclosuresUrl(stockCode),
    }
}
