import type { DividendCalendarEntry } from './dividends'
import {
    computePayoutRatioPct,
    latestDisclosedDividend,
    resolveProfitYear,
} from './dividends'
import type { FundamentalEntry } from './fundamentals'

export interface StockValuationSnapshot {
    fiscalYear: number | null
    filedAt: string | null
    filingUrl: string | null
    eps: number | null
    netProfit: number | null
    peRatio: number | null
    earningsYieldPct: number | null
    dividendProfitYear: number | null
    grossPerShare: number | null
    dividendYieldPct: number | null
    payoutRatioPct: number | null
    dividendParseStatus: DividendCalendarEntry['parseStatus'] | null
    hasAnyFundamentals: boolean
}

const PARSE_RANK: Record<FundamentalEntry['parseStatus'], number> = {
    parsed: 2,
    partial: 1,
    link_only: 0,
}

/** Dedupe by fiscal year — newest filedAt wins; prefer parsed over partial. */
export function pickLatestFundamental(entries: FundamentalEntry[]): FundamentalEntry | null {
    const byYear = new Map<number, FundamentalEntry>()

    for (const entry of entries) {
        const existing = byYear.get(entry.fiscalYear)
        if (!existing) {
            byYear.set(entry.fiscalYear, entry)
            continue
        }

        const rankNew = PARSE_RANK[entry.parseStatus]
        const rankOld = PARSE_RANK[existing.parseStatus]
        if (rankNew > rankOld || (rankNew === rankOld && entry.filedAt > existing.filedAt)) {
            byYear.set(entry.fiscalYear, entry)
        }
    }

    if (!byYear.size) return null

    return [...byYear.values()].sort((a, b) => b.fiscalYear - a.fiscalYear)[0]
}

export function computePeRatio(price: number, eps: number | null): number | null {
    if (eps === null || eps <= 0 || price <= 0) return null
    return price / eps
}

export function computeEarningsYieldPct(price: number, eps: number | null): number | null {
    if (eps === null || eps <= 0 || price <= 0) return null
    return (eps / price) * 100
}

export function computeTrailingDividendYieldPct(
    price: number,
    grossPerShare: number | null
): number | null {
    if (grossPerShare === null || grossPerShare <= 0 || price <= 0) return null
    return (grossPerShare / price) * 100
}

function resolvePayoutRatioPct(
    dividend: DividendCalendarEntry,
    fundamentals: FundamentalEntry[],
    epsByYear: Map<number, number>
): number | null {
    if (dividend.payoutRatioPct !== null) return dividend.payoutRatioPct

    const profitYear = resolveProfitYear(dividend)
    if (!profitYear || dividend.grossPerShare === null) return null

    const eps = epsByYear.get(profitYear)
    if (eps === undefined) return null

    return computePayoutRatioPct(dividend.grossPerShare, eps)
}

function buildEpsByYear(fundamentals: FundamentalEntry[]): Map<number, number> {
    const map = new Map<number, number>()
    for (const entry of fundamentals) {
        if (entry.parseStatus !== 'parsed' || entry.eps === null) continue
        map.set(entry.fiscalYear, entry.eps)
    }
    return map
}

export function buildStockValuationSnapshot(input: {
    price: number
    fundamentals: FundamentalEntry[]
    dividends: DividendCalendarEntry[]
}): StockValuationSnapshot {
    const latest = pickLatestFundamental(input.fundamentals)
    const latestDividend = latestDisclosedDividend(input.dividends)
    const epsByYear = buildEpsByYear(input.fundamentals)

    const eps = latest?.eps ?? null
    const netProfit = latest?.netProfit ?? null
    const grossPerShare = latestDividend?.grossPerShare ?? null
    const dividendProfitYear = latestDividend ? resolveProfitYear(latestDividend) : null

    const payoutRatioPct = latestDividend
        ? resolvePayoutRatioPct(latestDividend, input.fundamentals, epsByYear)
        : null

    const hasFundamentalRow =
        eps !== null ||
        netProfit !== null ||
        computePeRatio(input.price, eps) !== null ||
        computeEarningsYieldPct(input.price, eps) !== null

    const hasDividendRow =
        grossPerShare !== null ||
        computeTrailingDividendYieldPct(input.price, grossPerShare) !== null ||
        payoutRatioPct !== null

    return {
        fiscalYear: latest?.fiscalYear ?? null,
        filedAt: latest?.filedAt ?? null,
        filingUrl: latest?.url ?? null,
        eps,
        netProfit,
        peRatio: computePeRatio(input.price, eps),
        earningsYieldPct: computeEarningsYieldPct(input.price, eps),
        dividendProfitYear,
        grossPerShare,
        dividendYieldPct: computeTrailingDividendYieldPct(input.price, grossPerShare),
        payoutRatioPct,
        dividendParseStatus: latestDividend?.parseStatus ?? null,
        hasAnyFundamentals: hasFundamentalRow || hasDividendRow,
    }
}
