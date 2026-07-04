import type { DerivedBreadth, MarketSentiment } from '@/lib/data'
import { MarketSentimentStrip } from '@/components/markets/MarketSentimentStrip'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { BreadthAdvancersSparkline } from '@/components/home/BreadthAdvancersSparkline'

interface HomeMarketBreadthProps {
    sentiment: MarketSentiment
    breadth: DerivedBreadth | null
    asOfDate: string
}

export function HomeMarketBreadth({ sentiment, breadth, asOfDate }: HomeMarketBreadthProps) {
    const showExtended = breadth != null && breadth.history.length > 0

    return (
        <div className="space-y-3 min-w-0">
            <MarketSentimentStrip
                sentiment={sentiment}
                asOfDate={asOfDate}
                variant="breadth-only"
            />

            {showExtended && (
                <section
                    className="rounded-xl border border-border/60 bg-surface-secondary/40 px-3 py-2.5 space-y-2 min-w-0"
                    aria-labelledby="market-breadth-heading"
                >
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between min-w-0">
                        <div className="min-w-0">
                            <h2
                                id="market-breadth-heading"
                                className="font-heading text-sm font-bold text-text-primary tracking-tight"
                            >
                                Market breadth
                            </h2>
                            <p className="text-[11px] text-text-tertiary leading-snug">
                                Multi-session advancers trend and positioning vs 30-day average.
                            </p>
                        </div>
                        <DataFreshnessLabel asOfDate={asOfDate} variant="compact" className="shrink-0" />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                            <BreadthAdvancersSparkline history={breadth.history} />
                            <span className="text-[11px] text-text-tertiary font-data leading-tight">
                                5-day
                                <br />
                                advancers
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-data min-w-0">
                            <span className="text-text-secondary">
                                Above 30d avg{' '}
                                <span className="font-semibold text-text-primary tabular-nums">
                                    {breadth.pctAbove30dAvg.toFixed(1)}%
                                </span>
                            </span>
                            <span className="text-text-secondary">
                                52w highs{' '}
                                <span className="font-semibold text-up tabular-nums">{breadth.newHighs52w}</span>
                            </span>
                            <span className="text-text-secondary">
                                52w lows{' '}
                                <span className="font-semibold text-down tabular-nums">{breadth.newLows52w}</span>
                            </span>
                        </div>
                    </div>
                </section>
            )}
        </div>
    )
}
