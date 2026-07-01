"use client"

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { StockSummary } from '@/lib/types'
import type { MarketSentiment, SparklineMap } from '@/lib/data'
import { Search, ArrowUp, ArrowDown } from 'lucide-react'
import { MarketInstrumentRow } from '@/components/markets/MarketInstrumentRow'
import { MarketSentimentStrip } from '@/components/markets/MarketSentimentStrip'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { MarketStatus } from '@/components/home/MarketStatus'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { cn } from '@/lib/utils'

interface MarketsClientProps {
    initialStocks: StockSummary[]
    sentiment: MarketSentiment
    asOfDate: string
    sparklines: SparklineMap
}

type SortKey = 'turnover' | 'change' | 'price' | 'name'
type SortOrder = 'asc' | 'desc'

export function MarketsClient({ initialStocks, sentiment, asOfDate, sparklines }: MarketsClientProps) {
    const searchParams = useSearchParams()
    const router = useRouter()

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
            const params = new URLSearchParams()
            params.set('sort', key === 'turnover' ? 'volume' : key)
            params.set('order', order)
            router.replace(`/markets?${params.toString()}`, { scroll: false })
        },
        [router]
    )

    const displayStocks = useMemo(() => {
        let result = [...initialStocks]

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
    }, [initialStocks, query, sortKey, sortOrder])

    const handleSort = (key: SortKey) => {
        const nextOrder = sortKey === key ? (sortOrder === 'asc' ? 'desc' : 'asc') : 'desc'
        setSortKey(key)
        setSortOrder(nextOrder)
        syncUrl(key, nextOrder)
    }

    const pills: { label: string; key: SortKey }[] = [
        { label: 'Most Active', key: 'turnover' },
        { label: 'Top Movers', key: 'change' },
        { label: 'Price', key: 'price' },
        { label: 'Name', key: 'name' },
    ]

    return (
        <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-3">
                <div>
                    <h1 className="text-3xl font-semibold text-text-primary tracking-tight">
                        Market Overview
                    </h1>
                    <p className="text-text-secondary text-sm mt-1">
                        All companies listed on the Macedonian Stock Exchange — end-of-day data.
                    </p>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <MarketStatus asOfDate={asOfDate} />
                    <DataFreshnessLabel asOfDate={asOfDate} className="sm:text-right" />
                </div>
            </header>

            <MarketSentimentStrip sentiment={sentiment} asOfDate={asOfDate} />

            <div className="sticky top-0 z-10 -mx-4 px-4 py-3 md:-mx-0 md:px-0 bg-background/95 backdrop-blur-md border-b border-border/50 space-y-3">
                <div className="relative w-full md:max-w-md group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search markets..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all"
                    />
                </div>

                <div className="flex flex-wrap gap-2">
                    {pills.map((pill) => (
                        <button
                            key={pill.key}
                            type="button"
                            onClick={() => handleSort(pill.key)}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border min-h-[32px]',
                                sortKey === pill.key
                                    ? 'bg-brand-500/10 text-brand-600 border-brand-500/25 dark:text-brand-400'
                                    : 'bg-surface text-text-secondary border-border hover:border-brand-500/30 hover:text-text-primary'
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

            <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
                <span className="tabular-nums">{displayStocks.length} instruments</span>
            </div>

            <div className="rounded-xl border border-border/60 bg-surface overflow-hidden divide-y divide-border/60">
                <div className="hidden md:grid md:grid-cols-[1fr_72px_100px_72px_40px] gap-2 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-border/60">
                    <span>Instrument</span>
                    <span className="text-center">Trend</span>
                    <span className="text-right">Close</span>
                    <span className="text-right">Change</span>
                    <span />
                </div>
                {displayStocks.length > 0 ? (
                    displayStocks.map((stock, i) => (
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
                                <div className="px-4 py-3 border-t border-border/40">
                                    <SponsorSlot placement="in-feed" />
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="p-12 text-center text-text-tertiary">
                        No stocks found matching &quot;{query}&quot;
                    </div>
                )}
            </div>
        </div>
    )
}
