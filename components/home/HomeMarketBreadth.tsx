'use client'

import { useMemo, useState } from 'react'
import type { DerivedBreadth, MarketSentiment } from '@/lib/data'
import { MarketSentimentStrip } from '@/components/markets/MarketSentimentStrip'
import { BreadthAdvancersSparkline } from '@/components/home/BreadthAdvancersSparkline'
import { BreadthStockPreview } from '@/components/markets/BreadthStockPreview'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { useInstruments } from '@/components/providers/InstrumentsProvider'
import { useLocale } from '@/components/providers/LocaleProvider'
import { resolveStocksByCodes } from '@/lib/market-breadth-utils'
import { cn } from '@/lib/utils'

type Week52Expand = 'high' | 'low' | null

interface HomeMarketBreadthProps {
    sentiment: MarketSentiment
    breadth: DerivedBreadth | null
    asOfDate: string
}

const PREVIEW_LIMIT = 3

export function HomeMarketBreadth({ sentiment, breadth, asOfDate }: HomeMarketBreadthProps) {
    const { t } = useLocale()
    const instruments = useInstruments()
    const [expanded52w, setExpanded52w] = useState<Week52Expand>(null)
    const showExtended = breadth != null && breadth.history.length > 0

    const highPreview = useMemo(() => {
        if (!breadth?.high52wCodes?.length || expanded52w !== 'high') return []
        return resolveStocksByCodes(instruments, breadth.high52wCodes).slice(0, PREVIEW_LIMIT)
    }, [breadth?.high52wCodes, expanded52w, instruments])

    const lowPreview = useMemo(() => {
        if (!breadth?.low52wCodes?.length || expanded52w !== 'low') return []
        return resolveStocksByCodes(instruments, breadth.low52wCodes).slice(0, PREVIEW_LIMIT)
    }, [breadth?.low52wCodes, expanded52w, instruments])

    const toggle52w = (kind: Week52Expand) => {
        setExpanded52w((current) => (current === kind ? null : kind))
    }

    return (
        <section
            className="rounded-xl bg-surface-secondary p-3 space-y-3 min-w-0"
            aria-labelledby="market-breadth-sr-only"
        >
            <h2 id="market-breadth-sr-only" className="sr-only">
                {t('home.breadthSrOnly')}
            </h2>

            <MarketSentimentStrip
                sentiment={sentiment}
                asOfDate={asOfDate}
                variant="breadth-only"
                showFreshness={false}
                className="bg-surface-tertiary"
            />

            {showExtended && breadth ? (
                <div className="bg-surface-tertiary rounded-lg p-3 space-y-2 min-w-0">
                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                            <h3 className="sr-only font-heading text-sm font-bold text-text-primary tracking-tight">
                                {t('home.breadth')}
                            </h3>
                            <p className="text-[11px] text-text-tertiary leading-snug">{t('home.breadthSubtitle')}</p>
                            <InfoPopover label={t('home.breadth')}>{t('home.breadthPopover')}</InfoPopover>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 min-w-0 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2">
                        <div className="flex items-center gap-2 min-w-0">
                            <BreadthAdvancersSparkline history={breadth.history} />
                            <span className="inline-flex items-center gap-1 text-[11px] text-text-tertiary font-data leading-tight">
                                {t('home.advancers5d')}
                                <InfoPopover label={t('home.advancers5d')}>
                                    {t('home.advancers5dPopover')}
                                </InfoPopover>
                            </span>
                        </div>
                        <div className="flex flex-col gap-2 text-xs font-data min-w-0 sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
                            <span className="inline-flex items-center gap-1 text-text-secondary flex-wrap">
                                {t('home.above30dAvg')}
                                <InfoPopover label={t('home.above30dAvg')}>
                                    {t('home.above30dAvgPopover')}
                                </InfoPopover>
                                <span className="font-semibold text-text-primary tabular-nums">
                                    {breadth.pctAbove30dAvg.toFixed(1)}%
                                </span>
                            </span>
                            <button
                                type="button"
                                aria-expanded={expanded52w === 'high'}
                                onClick={() => toggle52w('high')}
                                className={cn(
                                    'inline-flex items-center gap-1 flex-wrap min-h-[44px] rounded-md px-1 transition-colors',
                                    expanded52w === 'high' ? 'bg-surface text-up' : 'text-text-secondary hover:bg-surface/80'
                                )}
                            >
                                {t('home.highs52w')}
                                <InfoPopover label={t('home.highs52w')}>{t('home.highs52wPopover')}</InfoPopover>
                                <span className="font-semibold text-up tabular-nums">{breadth.newHighs52w}</span>
                            </button>
                            <button
                                type="button"
                                aria-expanded={expanded52w === 'low'}
                                onClick={() => toggle52w('low')}
                                className={cn(
                                    'inline-flex items-center gap-1 flex-wrap min-h-[44px] rounded-md px-1 transition-colors',
                                    expanded52w === 'low' ? 'bg-surface text-down' : 'text-text-secondary hover:bg-surface/80'
                                )}
                            >
                                {t('home.lows52w')}
                                <InfoPopover label={t('home.lows52w')}>{t('home.lows52wPopover')}</InfoPopover>
                                <span className="font-semibold text-down tabular-nums">{breadth.newLows52w}</span>
                            </button>
                        </div>
                    </div>

                    {expanded52w === 'high' ? (
                        <BreadthStockPreview
                            stocks={highPreview}
                            viewAllHref="/markets?range=52w-high"
                            viewAllLabel={t('home.viewAll52wHighs')}
                        />
                    ) : null}
                    {expanded52w === 'low' ? (
                        <BreadthStockPreview
                            stocks={lowPreview}
                            viewAllHref="/markets?range=52w-low"
                            viewAllLabel={t('home.viewAll52wLows')}
                        />
                    ) : null}
                </div>
            ) : null}
        </section>
    )
}
