import type { MarketIndex, StockSummary } from '@/lib/types'
import type { DerivedBreadth, DerivedSectorRollup, MarketSentiment } from '@/lib/data'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { HomeIndexHero } from '@/components/home/HomeIndexHero'
import { HomeLeaderboardTabs } from '@/components/home/HomeLeaderboardTabs'
import { HomeMarketBreadth } from '@/components/home/HomeMarketBreadth'
import { HomeSectorStrip } from '@/components/home/HomeSectorStrip'

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
}: HomeMarketOverviewProps) {
    return (
        <div className="space-y-4 min-w-0">
            <header className="space-y-1 min-w-0">
                <h1 className="font-heading text-xl font-bold text-text-primary tracking-tight">
                    Market overview
                </h1>
                <DataFreshnessLabel asOfDate={asOfDate} />
            </header>

            <HomeIndexHero indices={indices} asOfDate={asOfDate} />

            <HomeMarketBreadth sentiment={sentiment} breadth={breadth} asOfDate={asOfDate} />

            <HomeSectorStrip sectors={sectors} asOfDate={asOfDate} />

            <HomeLeaderboardTabs
                gainers={gainers}
                losers={losers}
                mostActive={mostActive}
                weekHighs={weekHighs}
                weekLows={weekLows}
                consistentGainers={consistentGainers}
                asOfDate={asOfDate}
            />

            <SponsorSlot placement="mobile-banner" />
        </div>
    )
}
