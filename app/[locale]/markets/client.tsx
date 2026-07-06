"use client"

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StockSummary } from '@/lib/types'
import type { MarketSentiment, SparklineMap } from '@/lib/data'
import type { DividendCalendarEntry } from '@/lib/dividends'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { Search, ArrowUp, ArrowDown } from 'lucide-react'
import {
    MarketInstrumentRow,
    MARKET_ROW_ACTION_WIDTH,
    MARKET_ROW_CHANGE_WIDTH,
    MARKET_ROW_PRICE_WIDTH,
    MARKET_ROW_SPARKLINE_WIDTH,
} from '@/components/markets/MarketInstrumentRow'
import { MarketSentimentStrip } from '@/components/markets/MarketSentimentStrip'
import { MarketsResultsTable } from '@/components/results/MarketsResultsTable'
import { MarketsDividendsTable } from '@/components/dividends/MarketsDividendsTable'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
    filterStocksByMove,
    filterStocksByRange,
    type BreadthMove,
    type BreadthRange,
} from '@/lib/market-breadth-utils'
import { cn } from '@/lib/utils'

interface MarketsClientProps {
    initialStocks: StockSummary[]
    sentiment: MarketSentiment
    asOfDate: string
    sparklines: SparklineMap
    results: ResultsCalendarEntry[]
    expected: ExpectedResultsEntry[]
    dividends: DividendCalendarEntry[]
    upcomingExDates: DividendCalendarEntry[]
    lastIssuerScan: string | null
    issuerCount: number
    high52wCodes: string[]
    low52wCodes: string[]
}

type MarketsView = 'instruments' | 'results' | 'dividends'

type SortKey = 'turnover' | 'change' | 'price' | 'name'
type SortOrder = 'asc' | 'desc'

export function MarketsClient({
    initialStocks,
    sentiment,
    asOfDate,
    sparklines,
    results,
    expected,
    dividends,
    upcomingExDates,
    lastIssuerScan,
    issuerCount,
    high52wCodes,
    low52wCodes,
}: MarketsClientProps) {
    const { t } = useLocale()
    const searchParams = useSearchParams()
    const router = useRouter()

    const viewParam = searchParams.get('view')
    const view: MarketsView =
        viewParam === 'results' ? 'results' : viewParam === 'dividends' ? 'dividends' : 'instruments'

    const setView = useCallback(
        (next: MarketsView) => {
            const params = new URLSearchParams(searchParams.toString())
            if (next === 'results') {
                params.set('view', 'results')
            } else if (next === 'dividends') {
                params.set('view', 'dividends')
            } else {
                params.delete('view')
            }
            const query = params.toString()
            router.replace(query ? `/markets?${query}` : '/markets', { scroll: false })
        },
        [router, searchParams]
    )

    const [query, setQuery] = useState('')
    const [sortKey, setSortKey] = useState<SortKey>(() => {
        const s = searchParams.get('sort')
        if (s === 'volume') return 'turnover'
        return (s as SortKey) || 'turnover'
    })
    const [sortOrder, setSortOrder] = useState<SortOrder>(
        (searchParams.get('order') as SortOrder) || 'desc'
    )

    const syncUrl = useCallback(
        (key: SortKey, order: SortOrder) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('sort', key === 'turnover' ? 'volume' : key)
            params.set('order', order)
            router.replace(`/markets?${params.toString()}`, { scroll: false })
        },
        [router, searchParams]
    )

    const moveParam = searchParams.get('move') as BreadthMove | null
    const rangeParam = searchParams.get('range') as BreadthRange | null

    const displayStocks = useMemo(() => {
        let result = [...initialStocks]

        if (moveParam === 'up' || moveParam === 'down' || moveParam === 'flat') {
            result = filterStocksByMove(result, moveParam)
        } else if (rangeParam === '52w-high' || rangeParam === '52w-low') {
            result = filterStocksByRange(result, rangeParam, high52wCodes, low52wCodes)
        }

        if (query) {
            const lowerQ = query.toLowerCase()
            result = result.filter(
                (s) =>
                    s.code.toLowerCase().includes(lowerQ) ||
                    s.name.toLowerCase().includes(lowerQ)
            )
        }

        result.sort((a, b) => {
            let valA: string | number
            let valB: string | number

            if (sortKey === 'change') {
                valA = a.changePercent
                valB = b.changePercent
            } else if (sortKey === 'name') {
                valA = a.name.toLowerCase()
                valB = b.name.toLowerCase()
            } else if (sortKey === 'turnover') {
                valA = a.turnover
                valB = b.turnover
            } else {
                valA = a.price
                valB = b.price
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1
            return 0
        })

        return result
    }, [initialStocks, query, sortKey, sortOrder, moveParam, rangeParam, high52wCodes, low52wCodes])

    const handleSort = (key: SortKey) => {
        const nextOrder = sortKey === key ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'
        setSortKey(key)
        setSortOrder(nextOrder)
        syncUrl(key, nextOrder)
    }

    const pills: { label: string; key: SortKey }[] = [
        { label: t('markets.mostActive'), key: 'turnover' },
        { label: t('markets.topMovers'), key: 'change' },
        { label: t('markets.price'), key: 'price' },
        { label: t('markets.name'), key: 'name' },
    ]

    const columnHeaderStyle = {
        ['--sparkline' as string]: `${MARKET_ROW_SPARKLINE_WIDTH}px`,
        ['--change' as string]: `${MARKET_ROW_CHANGE_WIDTH}px`,
        ['--price' as string]: `${MARKET_ROW_PRICE_WIDTH}px`,
        ['--action' as string]: `${MARKET_ROW_ACTION_WIDTH}px`,
    }

    return (
        <div className="flex flex-col gap-3 min-w-0">
            <header className="space-y-1">
                <h1 className="text-2xl sm:text-3xl font-semibold font-heading text-text-primary tracking-tight">
                    {t('markets.title')}
                </h1>
                <p className="text-text-secondary text-sm">{t('markets.subtitle')}</p>
            </header>

            <MarketSentimentStrip sentiment={sentiment} asOfDate={asOfDate} />

            <div className="flex flex-wrap gap-2">
                {(
                    [
                        { id: 'instruments' as const, label: t('markets.allInstruments') },
                        { id: 'results' as const, label: t('markets.recentResults') },
                        { id: 'dividends' as const, label: t('markets.dividendsTab') },
                    ] as const
                ).map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setView(tab.id)}
                        className={cn(
                            'px-3 py-2 rounded-full text-xs font-semibold transition-all border min-h-[44px]',
                            view === tab.id
                                ? 'bg-surface shadow-sm text-accent border-accent/20'
                                : 'bg-surface-secondary/40 text-text-tertiary border-border hover:text-text-secondary'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {view === 'results' ? (
                <MarketsResultsTable
                    results={results}
                    expected={expected}
                    lastIssuerScan={lastIssuerScan}
                    issuerCount={issuerCount}
                />
            ) : view === 'dividends' ? (
                <MarketsDividendsTable
                    recent={dividends}
                    upcoming={upcomingExDates}
                    lastIssuerScan={lastIssuerScan}
                    issuerCount={issuerCount}
                />
            ) : (
                <>
            <div className="sticky top-0 z-10 py-2 bg-background/95 backdrop-blur-md border-b border-border space-y-2 min-w-0">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-accent transition-colors" />
                    <input
                        type="text"
                        placeholder={t('markets.searchPlaceholder')}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all min-h-[44px]"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {pills.map((pill) => (
                        <button
                            key={pill.key}
                            type="button"
                            onClick={() => handleSort(pill.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all border min-h-[44px]',
                                sortKey === pill.key
                                    ? 'bg-surface shadow-sm text-accent border-accent/20'
                                    : 'bg-surface-secondary/40 text-text-tertiary border-border hover:text-text-secondary hover:border-border-active'
                            )}
                        >
                            {pill.label}
                            {sortKey === pill.key &&
                                (sortOrder === 'desc' ? (
                                    <ArrowDown className="w-3 h-3" aria-hidden />
                                ) : (
                                    <ArrowUp className="w-3 h-3" aria-hidden />
                                ))}
                        </button>
                    ))}
                </div>
            </div>

            <div className="text-xs text-text-tertiary font-data tabular-nums">
                {t('markets.instrumentCount', { count: displayStocks.length })}
            </div>

            <div className="min-w-0 border-t border-border">
                <div
                    className="hidden sm:grid items-center gap-2 px-0 py-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-border min-w-0 grid-cols-[minmax(0,1fr)_var(--sparkline)_var(--change)_var(--price)_var(--action)]"
                    style={columnHeaderStyle}
                >
                    <span>{t('markets.instrument')}</span>
                    <span className="text-center">{t('markets.trend')}</span>
                    <span className="text-right">{t('markets.change')}</span>
                    <span className="text-right">{t('markets.close')}</span>
                    <span />
                </div>

                {displayStocks.length > 0 ? (
                    <div className="divide-y divide-border">
                        {displayStocks.map((stock, i) => (
                            <div key={stock.code}>
                                <MarketInstrumentRow
                                    stock={stock}
                                    sparkline={
                                        stock.chartSeries?.length
                                            ? stock.chartSeries
                                            : sparklines[stock.code]
                                    }
                                />
                                {(i + 1) % 8 === 0 && i < displayStocks.length - 1 && (
                                    <div className="py-2 border-t border-border">
                                        <SponsorSlot placement="rectangle" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="py-12 text-center text-text-tertiary">
                        {t('markets.noMatch', { query })}
                    </div>
                )}
            </div>
                </>
            )}
        </div>
    )
}
