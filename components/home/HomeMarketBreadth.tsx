import type { DerivedBreadth, MarketSentiment } from '@/lib/data'
import { MarketSentimentStrip } from '@/components/markets/MarketSentimentStrip'
import { BreadthAdvancersSparkline } from '@/components/home/BreadthAdvancersSparkline'
import { InfoPopover } from '@/components/ui/InfoPopover'

interface HomeMarketBreadthProps {
    sentiment: MarketSentiment
    breadth: DerivedBreadth | null
    asOfDate: string
}

export function HomeMarketBreadth({ sentiment, breadth, asOfDate }: HomeMarketBreadthProps) {
    const showExtended = breadth != null && breadth.history.length > 0

    return (
        <section
            className="rounded-xl bg-surface-secondary p-3 space-y-3 min-w-0"
            aria-labelledby="market-context-heading"
        >
            <h2
                id="market-context-heading"
                className="font-heading text-base font-bold text-text-primary tracking-tight"
            >
                Market context
            </h2>

            <MarketSentimentStrip
                sentiment={sentiment}
                asOfDate={asOfDate}
                variant="breadth-only"
                showFreshness={false}
                className="bg-surface-tertiary"
            />

            {showExtended && (
                <div className="bg-surface-tertiary rounded-lg p-3 space-y-2 min-w-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="font-heading text-sm font-bold text-text-primary tracking-tight">
                                Market breadth
                            </h3>
                            <InfoPopover label="Market breadth">
                                Whether the same trend holds across recent sessions.
                            </InfoPopover>
                        </div>
                        <p className="text-[11px] text-text-tertiary leading-snug">
                            Multi-session advancers trend and positioning vs 30-day average.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <BreadthAdvancersSparkline history={breadth.history} />
                            <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary font-data leading-tight">
                                5-day advancers
                                <InfoPopover label="5-day advancers">
                                    Number of rising stocks per session over the last 5 sessions.
                                </InfoPopover>
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 text-xs font-data min-w-0 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
                            <span className="inline-flex items-center gap-1 text-text-secondary flex-wrap">
                                Above 30d avg
                                <InfoPopover label="Above 30-day average">
                                    Share of stocks whose latest price is above their own 30-day average.
                                </InfoPopover>
                                <span className="font-semibold text-text-primary tabular-nums">
                                    {breadth.pctAbove30dAvg.toFixed(1)}%
                                </span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-text-secondary flex-wrap">
                                52w highs
                                <InfoPopover label="52-week highs">
                                    Stocks that closed at their highest level in the past year.
                                </InfoPopover>
                                <span className="font-semibold text-up tabular-nums">{breadth.newHighs52w}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 text-text-secondary flex-wrap">
                                52w lows
                                <InfoPopover label="52-week lows">
                                    Stocks that closed at their lowest level in the past year.
                                </InfoPopover>
                                <span className="font-semibold text-down tabular-nums">{breadth.newLows52w}</span>
                            </span>
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
