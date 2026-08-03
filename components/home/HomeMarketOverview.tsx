import type { MarketIndex, StockSummary, NewsItem } from '@/lib/types'
import type { DerivedBreadth, IndexDetails, MarketSentiment } from '@/lib/data'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import type { Mbi10DividendHighlight } from '@/lib/dividend-home-banner'
import { HomeIndexStrip } from '@/components/home/HomeIndexStrip'
import { HomeLeaderboardTabs } from '@/components/home/HomeLeaderboardTabs'
import { HomeMbi10Chart } from '@/components/home/HomeMbi10Chart'
import { HomeMarketBreadth } from '@/components/home/HomeMarketBreadth'
import { HomeFilingsHub } from '@/components/home/HomeFilingsHub'
import { HomeDividendsPanel } from '@/components/dividends/HomeDividendsPanel'

interface HomeMarketOverviewProps {
    indices: MarketIndex[]
    mbi10: IndexDetails | null
    gainers: StockSummary[]
    losers: StockSummary[]
    mostActive: StockSummary[]
    weekHighs: StockSummary[]
    weekLows: StockSummary[]
    consistentGainers: StockSummary[]
    breadth: DerivedBreadth | null
    sentiment: MarketSentiment
    asOfDate: string
    news: NewsItem[]
    recentResults: ResultsCalendarEntry[]
    expectedResults: ExpectedResultsEntry[]
    dividendHighlights: Mbi10DividendHighlight[]
    lastIssuerScan: string | null
}

export function HomeMarketOverview({
    indices,
    mbi10,
    gainers,
    losers,
    mostActive,
    weekHighs,
    weekLows,
    consistentGainers,
    breadth,
    sentiment,
    asOfDate,
    news,
    recentResults,
    expectedResults,
    dividendHighlights,
    lastIssuerScan,
}: HomeMarketOverviewProps) {
    return (
        <div className="space-y-4 min-w-0 max-w-full">
            <HomeLeaderboardTabs
                gainers={gainers}
                losers={losers}
                mostActive={mostActive}
                weekHighs={weekHighs}
                weekLows={weekLows}
                consistentGainers={consistentGainers}
                asOfDate={asOfDate}
            />

            {mbi10 ? <HomeMbi10Chart index={mbi10} asOfDate={asOfDate} /> : null}

            <div className="pt-4 sm:pt-2">
                <HomeMarketBreadth sentiment={sentiment} breadth={breadth} asOfDate={asOfDate} />
            </div>

            <HomeIndexStrip indices={indices} asOfDate={asOfDate} />

            <HomeFilingsHub
                news={news}
                recentResults={recentResults}
                expectedResults={expectedResults}
                lastIssuerScan={lastIssuerScan}
            />

            <HomeDividendsPanel
                highlights={dividendHighlights}
                variant="mobile"
                className="lg:hidden"
            />
        </div>
    )
}
