import type { MarketIndex, StockSummary } from '@/lib/types'
import type { MarketSentiment } from '@/lib/data'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { MarketSentimentStrip } from '@/components/markets/MarketSentimentStrip'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { HomeIndexHero } from '@/components/home/HomeIndexHero'
import { HomeLeaderboardTabs } from '@/components/home/HomeLeaderboardTabs'

interface HomeMarketOverviewProps {
    indices: MarketIndex[]
    gainers: StockSummary[]
    losers: StockSummary[]
    mostActive: StockSummary[]
    sentiment: MarketSentiment
    asOfDate: string
}

export function HomeMarketOverview({
    indices,
    gainers,
    losers,
    mostActive,
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

            <MarketSentimentStrip
                sentiment={sentiment}
                asOfDate={asOfDate}
                variant="breadth-only"
            />

            <HomeLeaderboardTabs
                gainers={gainers}
                losers={losers}
                mostActive={mostActive}
                asOfDate={asOfDate}
            />

            <SponsorSlot placement="mobile-banner" />
        </div>
    )
}
