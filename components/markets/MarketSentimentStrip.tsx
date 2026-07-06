'use client'

import { useMemo, useState } from 'react'
import type { MarketSentiment } from '@/lib/market-derived-types'
import { formatIndexLevel } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { DataFreshnessLabel } from './DataFreshnessLabel'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { BreadthStockPreview } from '@/components/markets/BreadthStockPreview'
import { useInstruments } from '@/components/providers/InstrumentsProvider'
import { useLocale } from '@/components/providers/LocaleProvider'
import { filterStocksByMove, type BreadthMove } from '@/lib/market-breadth-utils'
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

const PREVIEW_LIMIT = 3

export function MarketSentimentStrip({
    sentiment,
    asOfDate,
    className,
    hidePrimaryIndex = false,
    variant = 'default',
    showFreshness = true,
}: MarketSentimentStripProps) {
    const { t } = useLocale()
    const instruments = useInstruments()
    const [expandedMove, setExpandedMove] = useState<BreadthMove | null>(null)

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

    const leanLabel = breadthOnly
        ? lean === 'up'
            ? t('markets.upLean')
            : lean === 'down'
              ? t('markets.downLean')
              : t('markets.mixed')
        : lean === 'up'
          ? t('markets.bullish')
          : lean === 'down'
            ? t('markets.bearish')
            : t('markets.mixed')

    const previewStocks = useMemo(() => {
        if (!expandedMove) return []
        return filterStocksByMove(instruments, expandedMove).slice(0, PREVIEW_LIMIT)
    }, [expandedMove, instruments])

    const viewAllHref = expandedMove ? `/markets?move=${expandedMove}` : '/markets'
    const viewAllLabel =
        expandedMove === 'up'
            ? t('markets.viewAllAdvancers')
            : expandedMove === 'down'
              ? t('markets.viewAllDecliners')
              : t('markets.viewAllUnchanged')

    const toggleMove = (move: BreadthMove) => {
        setExpandedMove((current) => (current === move ? null : move))
    }

    return (
        <section
            className={cn('rounded-xl bg-surface-secondary px-3 py-2 space-y-1.5 min-w-0', className)}
            aria-labelledby={breadthOnly ? 'session-breadth-heading' : undefined}
        >
            {breadthOnly && (
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between min-w-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <h2
                                id="session-breadth-heading"
                                className="sr-only font-heading text-sm font-bold text-text-primary tracking-tight"
                            >
                                {t('markets.sessionBreadth.title')}
                            </h2>
                            <p className="text-[11px] text-text-tertiary leading-snug">
                                {t('markets.sessionBreadth.subtitle')}
                            </p>
                            <InfoPopover label={t('markets.sessionBreadth.title')}>
                                {t('markets.sessionBreadth.popover')}
                            </InfoPopover>
                        </div>
                    </div>
                    {showFreshness && (
                        <DataFreshnessLabel asOfDate={asOfDate} variant="compact" className="shrink-0" />
                    )}
                </div>
            )}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    <button
                        type="button"
                        aria-expanded={expandedMove === 'up'}
                        onClick={() => toggleMove('up')}
                        className={cn(
                            'inline-flex items-center gap-1 font-semibold font-data min-h-[44px] px-1 rounded-md transition-colors',
                            expandedMove === 'up' ? 'bg-surface text-up' : 'text-up hover:bg-surface/80'
                        )}
                    >
                        <ArrowUp className="h-3 w-3" aria-hidden />
                        {t('markets.breadthUp', { count: advancers })}
                    </button>
                    <button
                        type="button"
                        aria-expanded={expandedMove === 'down'}
                        onClick={() => toggleMove('down')}
                        className={cn(
                            'inline-flex items-center gap-1 font-semibold font-data min-h-[44px] px-1 rounded-md transition-colors',
                            expandedMove === 'down' ? 'bg-surface text-down' : 'text-down hover:bg-surface/80'
                        )}
                    >
                        <ArrowDown className="h-3 w-3" aria-hidden />
                        {t('markets.breadthDown', { count: decliners })}
                    </button>
                    <button
                        type="button"
                        aria-expanded={expandedMove === 'flat'}
                        onClick={() => toggleMove('flat')}
                        className={cn(
                            'inline-flex items-center gap-1 text-text-tertiary font-data min-h-[44px] px-1 rounded-md transition-colors',
                            expandedMove === 'flat' ? 'bg-surface text-text-secondary' : 'hover:bg-surface/80'
                        )}
                    >
                        {t('markets.breadthFlat', { count: unchanged })}
                    </button>
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

            {expandedMove ? (
                <BreadthStockPreview
                    stocks={previewStocks}
                    viewAllHref={viewAllHref}
                    viewAllLabel={viewAllLabel}
                />
            ) : null}

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
