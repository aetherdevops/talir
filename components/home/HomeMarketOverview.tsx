import type { MarketIndex, StockSummary } from '@/lib/types'
import type { DerivedBreadth, DerivedSectorRollup, MarketSentiment } from '@/lib/data'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { HomeIndexStrip } from '@/components/home/HomeIndexStrip'
import { HomeLeaderboardTabs } from '@/components/home/HomeLeaderboardTabs'
import { HomeMarketBreadth } from '@/components/home/HomeMarketBreadth'
import { HomeSectorStrip } from '@/components/home/HomeSectorStrip'
import { RecentResultsSection, ExpectedResultsSection } from '@/components/results/ResultsCalendarSections'

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
    recentResults: ResultsCalendarEntry[]
    expectedResults: ExpectedResultsEntry[]
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
    recentResults,
    expectedResults,
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

            <RecentResultsSection recent={recentResults} limit={5} />

            <ExpectedResultsSection expected={expectedResults} limit={5} />

            <HomeMarketBreadth sentiment={sentiment} breadth={breadth} asOfDate={asOfDate} />

            <HomeSectorStrip sectors={sectors} />

            <SponsorSlot placement="mobile-banner" />
            <SponsorSlot placement="rectangle" className="hidden md:flex" />

            <HomeIndexStrip indices={indices} asOfDate={asOfDate} />
        </div>
    )
}
