/**
 * Home MBI10 dividend invite banner helpers.
 */
import {
    buildDividendScorecard,
    type DividendScorecard,
} from './dividend-scorecard'
import {
    latestDisclosedDividend,
    nextUpcomingExDividend,
    type DividendCalendarEntry,
} from './dividends'
import { getMbi10Codes } from './index-constituents'

export interface Mbi10DividendHighlight {
    stockCode: string
    stockName: string
    scorecard: DividendScorecard
    latest: DividendCalendarEntry
    upcoming: DividendCalendarEntry | null
    /** Sort key — higher = more attractive for a dividend investor. */
    appealScore: number
}

function appealScore(scorecard: DividendScorecard, upcoming: DividendCalendarEntry | null): number {
    let score = 0
    if (scorecard.trailingYieldPct != null && scorecard.trailingYieldPct > 0) {
        score += Math.min(scorecard.trailingYieldPct, 12) * 3
    }
    score += Math.min(scorecard.dividendStreakYears, 8) * 4
    if (scorecard.yoyDpsGrowthPct != null && scorecard.yoyDpsGrowthPct > 0) {
        score += Math.min(scorecard.yoyDpsGrowthPct, 20)
    }
    if (upcoming?.exDate) score += 15
    if (scorecard.latestGrossPerShare != null) score += 2
    return score
}

/**
 * MBI10 constituents with at least one disclosed gross DPS, ranked for a
 * dividend-focused invite banner (yield, streak, upcoming ex, growth).
 */
export function buildMbi10DividendHighlights(input: {
    byIssuer: Record<string, DividendCalendarEntry[]>
    priceByCode?: Record<string, number | null | undefined>
    limit?: number
}): Mbi10DividendHighlight[] {
    const mbi10 = new Set(getMbi10Codes().map((c) => c.toUpperCase()))
    const limit = input.limit ?? 5
    const out: Mbi10DividendHighlight[] = []

    for (const [code, entries] of Object.entries(input.byIssuer)) {
        if (!mbi10.has(code.toUpperCase())) continue
        const latest = latestDisclosedDividend(entries)
        if (!latest || latest.grossPerShare == null) continue

        const scorecard = buildDividendScorecard({
            stockCode: code,
            entries,
            currentPrice: input.priceByCode?.[code] ?? null,
        })
        const upcoming = nextUpcomingExDividend(entries)
        out.push({
            stockCode: code,
            stockName: latest.stockName,
            scorecard,
            latest,
            upcoming,
            appealScore: appealScore(scorecard, upcoming),
        })
    }

    return out.sort((a, b) => b.appealScore - a.appealScore).slice(0, limit)
}
