import type { MarketIndex, StockSummary, NewsItem } from '@/lib/types'
import type { DerivedBreadth, DerivedSectorRollup, MarketSentiment } from '@/lib/data'
import type { DividendCalendarEntry } from '@/lib/dividends'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { HomeIndexStrip } from '@/components/home/HomeIndexStrip'
import { HomeLeaderboardTabs } from '@/components/home/HomeLeaderboardTabs'
import { HomeMarketBreadth } from '@/components/home/HomeMarketBreadth'
import { HomeSectorStrip } from '@/components/home/HomeSectorStrip'
import { HomeFilingsHub } from '@/components/home/HomeFilingsHub'
import { HomeDividendsPanel } from '@/components/dividends/HomeDividendsPanel'

interface HomeMarketOverviewProps {
    indices: MarketIndex[]
    gainers: StockSummary[]
    losers: StockSummary[]
    mostActive: StockSummary[]
    weekHighs: StockSummary[]
    weekLows: StockSummary[]
    consistentGainers: StockSummary[]
    breadth: DerivedBreadth | null
    sectors: DerivedSectorRollup[]
    sentiment: MarketSentiment
    asOfDate: string
    news: NewsItem[]
    recentResults: ResultsCalendarEntry[]
    expectedResults: ExpectedResultsEntry[]
    recentDividends: DividendCalendarEntry[]
    upcomingExDates: DividendCalendarEntry[]
    lastIssuerScan: string | null
}

export function HomeMarketOverview({
    indices,
    gainers,
    losers,
    mostActive,
    weekHighs,
    weekLows,
    consistentGainers,
    breadth,
    sectors,
    sentiment,
    asOfDate,
    news,
    recentResults,
    expectedResults,
    recentDividends,
    upcomingExDates,
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

            <HomeSectorStrip sectors={sectors} />

            <SponsorSlot placement="mobile-banner" />
            <SponsorSlot placement="rectangle" className="hidden md:flex" />

            <HomeMarketBreadth sentiment={sentiment} breadth={breadth} asOfDate={asOfDate} />

            <HomeIndexStrip indices={indices} asOfDate={asOfDate} />

            <HomeFilingsHub
                news={news}
                recentResults={recentResults}
                expectedResults={expectedResults}
                lastIssuerScan={lastIssuerScan}
            />

            <HomeDividendsPanel
                recent={recentDividends}
                upcoming={upcomingExDates}
                variant="mobile"
                className="lg:hidden"
            />
        </div>
    )
}
