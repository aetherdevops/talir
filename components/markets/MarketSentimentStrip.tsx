import type { MarketSentiment } from '@/lib/data'
import { formatPrice, formatPriceChange } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { DataFreshnessLabel } from './DataFreshnessLabel'
import { ArrowDown, ArrowUp } from 'lucide-react'

interface MarketSentimentStripProps {
    sentiment: MarketSentiment
    asOfDate: string
    className?: string
}

export function MarketSentimentStrip({ sentiment, asOfDate, className }: MarketSentimentStripProps) {
    const { advancers, decliners, unchanged, primaryIndex } = sentiment
    const total = advancers + decliners + unchanged
    const bullishPct = total > 0 ? (advancers / total) * 100 : 50
    const lean = advancers > decliners ? 'up' : advancers < decliners ? 'down' : 'flat'

    return (
        <div
            className={cn(
                'rounded-xl border border-border/60 bg-surface-secondary/40 px-4 py-3 space-y-2',
                className
            )}
        >
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                    <span className="inline-flex items-center gap-1 text-up font-semibold font-data">
                        <ArrowUp className="h-3 w-3" aria-hidden />
                        {advancers} up
                    </span>
                    <span className="inline-flex items-center gap-1 text-down font-semibold font-data">
                        <ArrowDown className="h-3 w-3" aria-hidden />
                        {decliners} down
                    </span>
                    <span className="text-text-tertiary font-data">{unchanged} flat</span>
                    {primaryIndex && (
                        <span className="text-text-secondary border-l border-border pl-4 font-data">
                            {primaryIndex.name}{' '}
                            <span className="font-medium text-text-primary">
                                {formatPrice(primaryIndex.value)}
                            </span>{' '}
                            <span
                                className={cn(
                                    'font-semibold',
                                    primaryIndex.changePercent > 0
                                        ? 'text-up'
                                        : primaryIndex.changePercent < 0
                                          ? 'text-down'
                                          : 'text-text-secondary'
                                )}
                            >
                                {formatPriceChange(primaryIndex.changePercent)}
                            </span>
                        </span>
                    )}
                </div>
                <DataFreshnessLabel asOfDate={asOfDate} variant="compact" />
            </div>

            <div className="flex items-center gap-2">
                <div className="flex-1 h-1.5 rounded-full bg-surface-tertiary overflow-hidden flex">
                    <div
                        className="h-full bg-up/70 transition-all"
                        style={{ width: `${bullishPct}%` }}
                        aria-hidden
                    />
                    <div
                        className="h-full bg-down/70 transition-all"
                        style={{ width: `${100 - bullishPct}%` }}
                        aria-hidden
                    />
                </div>
                <span
                    className={cn(
                        'text-[10px] font-semibold uppercase tracking-wide shrink-0',
                        lean === 'up' ? 'text-up' : lean === 'down' ? 'text-down' : 'text-text-tertiary'
                    )}
                >
                    {lean === 'up' ? 'Bullish' : lean === 'down' ? 'Bearish' : 'Mixed'}
                </span>
            </div>
        </div>
    )
}
