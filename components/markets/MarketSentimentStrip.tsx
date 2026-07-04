import type { MarketSentiment } from '@/lib/data'
import { formatIndexLevel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { DataFreshnessLabel } from './DataFreshnessLabel'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { ArrowDown, ArrowUp } from 'lucide-react'

interface MarketSentimentStripProps {
    sentiment: MarketSentiment
    asOfDate: string
    className?: string
    /** @deprecated Prefer variant="breadth-only" on the homepage */
    hidePrimaryIndex?: boolean
    variant?: 'default' | 'breadth-only'
    showFreshness?: boolean
}

export function MarketSentimentStrip({
    sentiment,
    asOfDate,
    className,
    hidePrimaryIndex = false,
    variant = 'default',
    showFreshness = true,
}: MarketSentimentStripProps) {
    const breadthOnly = variant === 'breadth-only' || hidePrimaryIndex
    const { advancers, decliners, unchanged, primaryIndex } = sentiment
    const total = advancers + decliners + unchanged
    const bullishPct = total > 0 ? (advancers / total) * 100 : 50

    const lean = (() => {
        if (total === 0) return 'flat' as const

        if (unchanged / total >= 0.75) return 'flat' as const

        if (advancers > 0 && decliners > 0) {
            const breadthRatio = Math.min(advancers, decliners) / Math.max(advancers, decliners)
            if (breadthRatio >= 0.8) return 'flat' as const
        }

        if (advancers > decliners) return 'up' as const
        if (decliners > advancers) return 'down' as const
        return 'flat' as const
    })()

    const leanLabel =
        lean === 'up' ? (breadthOnly ? 'Up lean' : 'BULLISH') : lean === 'down' ? (breadthOnly ? 'Down lean' : 'BEARISH') : breadthOnly ? 'Mixed' : 'MIXED'

    return (
        <section
            className={cn(
                'rounded-xl border border-border/60 bg-surface-secondary/40 px-3 py-2 space-y-1.5 min-w-0',
                className
            )}
            aria-labelledby={breadthOnly ? 'session-breadth-heading' : undefined}
        >
            {breadthOnly && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between min-w-0">
                    <div className="min-w-0">
                        <h2
                            id="session-breadth-heading"
                            className="font-heading text-sm font-bold text-text-primary tracking-tight"
                        >
                            Session breadth
                        </h2>
                        <p className="text-[11px] text-text-tertiary leading-snug">
                            Advancers and decliners across MSE equities, end-of-day.
                        </p>
                    </div>
                    {showFreshness && (
                        <DataFreshnessLabel asOfDate={asOfDate} variant="compact" className="shrink-0" />
                    )}
                </div>
            )}
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
                    {primaryIndex && !breadthOnly && (
                        <span className="text-text-secondary border-l border-border pl-4 font-data">
                            {primaryIndex.name}{' '}
                            <span className="font-medium text-text-primary">
                                {formatIndexLevel(primaryIndex.value)}
                            </span>{' '}
                            <ChangeLabel change={primaryIndex.changePercent} className="text-xs" />
                        </span>
                    )}
                </div>
                {!breadthOnly && showFreshness && (
                    <DataFreshnessLabel asOfDate={asOfDate} variant="compact" />
                )}
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
                    {leanLabel}
                </span>
            </div>
        </section>
    )
}
