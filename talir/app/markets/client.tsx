"use client"

import { useState, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { StockSummary } from '@/lib/types'
import { Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { StockRow } from '@/components/stock/StockRow'
import { cn } from '@/lib/utils'

interface MarketsClientProps {
    initialStocks: StockSummary[]
}

type SortKey = 'volume' | 'change' | 'price' | 'name'
type SortOrder = 'asc' | 'desc'

export function MarketsClient({ initialStocks }: MarketsClientProps) {
    const searchParams = useSearchParams()

    // Initial state from URL or defaults
    const [query, setQuery] = useState('')
    const [sortKey, setSortKey] = useState<SortKey>((searchParams.get('sort') as SortKey) || 'volume')
    const [sortOrder, setSortOrder] = useState<SortOrder>((searchParams.get('order') as SortOrder) || 'desc')

    // Derived state for sorting and filtering
    const displayStocks = useMemo(() => {
        let result = [...initialStocks]

        // 1. Filter
        if (query) {
            const lowerQ = query.toLowerCase()
            result = result.filter(s =>
                s.code.toLowerCase().includes(lowerQ) ||
                s.name.toLowerCase().includes(lowerQ)
            )
        }

        // 2. Sort
        result.sort((a, b) => {
            let valA: any = a[sortKey as keyof StockSummary]
            let valB: any = b[sortKey as keyof StockSummary]

            // Handle special cases if any (e.g. name is string, others number)
            // 'change' maps to 'changePercent' in StockSummary for functionality, but key is 'change' in UI
            if (sortKey === 'change') {
                valA = a.changePercent
                valB = b.changePercent
            } else if (sortKey === 'name') {
                valA = a.name.toLowerCase() // Case insensitive sort
                valB = b.name.toLowerCase()
                // Also code as fallback?
            } else if (sortKey === 'volume') {
                valA = a.volume
                valB = b.volume
            } else if (sortKey === 'price') {
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
        if (sortKey === key) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
        } else {
            setSortKey(key)
            setSortOrder('desc') // Default to desc for most metrics
        }
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-normal text-text-primary tracking-tight">Market Overview</h1>
                <p className="text-text-secondary">Track all companies listed on the Macedonian Stock Exchange (MSE).</p>
            </div>

            {/* Controls Toolbar */}
            <div className="sticky top-0 z-10 -mx-4 px-4 py-4 md:py-4 md:-mx-0 md:px-0 bg-background/95 backdrop-blur-md flex flex-col md:flex-row gap-4 justify-between items-center transition-all border-b border-transparent md:border-b-0">
                {/* Search */}
                <div className="relative w-full md:w-96 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary group-focus-within:text-brand-500 transition-colors" />
                    <input
                        type="text"
                        placeholder="Search markets..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-surface border border-border rounded-xl text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all shadow-sm"
                    />
                </div>

                {/* Sort Pills */}
                <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
                    {[
                        { label: 'Most Active', key: 'volume' },
                        { label: 'Top Movers', key: 'change' },
                        { label: 'Price', key: 'price' },
                        { label: 'Name', key: 'name' },
                    ].map((pill) => (
                        <button
                            key={pill.key}
                            onClick={() => handleSort(pill.key as SortKey)}
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border",
                                sortKey === pill.key
                                    ? "bg-brand-500/10 text-brand-600 border-brand-500/20 dark:text-brand-400"
                                    : "bg-surface text-text-secondary border-border hover:border-brand-500/30 hover:text-text-primary"
                            )}
                        >
                            {pill.label}
                            {sortKey === pill.key && (
                                sortOrder === 'desc' ? <ArrowDown className="w-3 h-3" /> : <ArrowUp className="w-3 h-3" />
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Results Info */}
            <div className="flex items-center justify-between text-xs text-text-tertiary px-1">
                <span>{displayStocks.length} instruments found</span>
                <span>Sorted by {sortKey} {sortOrder}</span>
            </div>

            {/* List */}
            <div className="grid grid-cols-1 bg-surface rounded-3xl border border-border overflow-hidden shadow-sm">
                {displayStocks.length > 0 ? (
                    <div className="divide-y divide-border">
                        {displayStocks.map(stock => (
                            <StockRow
                                key={stock.code}
                                stock={stock}
                                showVolume={true}
                                className="hover:bg-surface-secondary/50 py-4"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="p-12 text-center text-text-tertiary">
                        No stocks found matching "{query}"
                    </div>
                )}
            </div>
        </div>
    )
}
