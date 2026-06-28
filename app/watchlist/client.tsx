
"use client"

import { useState, useMemo } from 'react'
import { useWatchlistStore } from "@/lib/stores/watchlist"
import { getAllStocks } from "@/lib/data"
import { WatchlistEmptyState } from "@/components/watchlist/WatchlistEmptyState"
import { CreateListModal } from "@/components/watchlist/CreateListModal"
import { AddToWatchlistModal } from "@/components/watchlist/AddToWatchlistModal"
import { StockRow } from "@/components/stock/StockRow"
import { Button } from "@/components/ui/Button"
import { Plus, MoreHorizontal, ChevronRight, Check, ArrowUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from 'next/link'
import { RenameListModal } from "@/components/watchlist/RenameListModal"
import { NewsSection } from "@/components/common/NewsSection"
// Import data fetching - in a client component we might need to pass data as props or use SWR/React Query.
// For this hybrid approach, we'll fetch in page wrapper and pass down, OR use a useEffect to load essential data.
// Since getAllStocks is async and reads file, it's server-only usually. 
// We need to fetch this data on server and pass it.
// So we will split this into a client component for logic and a server page for data.
// BUT for simpler iteration, let's assume this file is Server component that wraps a Client component, OR we make this client and accept props.

// Let's make this file the client component `WatchlistClient` and have the page default export import it.
// Actually, easier to make this the page but we can't fully use `getAllStocks` directly if it uses `fs`.
// We need `getAllStocks` to be called in the default export (Server Component) and pass data to client.

import { StockSummary } from '@/lib/types'

interface WatchlistPageProps {
    stockData: StockSummary[]
}

export function WatchlistClient({ stockData }: WatchlistPageProps) {
    const { watchlists, activeListId, setActiveList, deleteList, removeFromList } = useWatchlistStore()

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false) // Renamed from isAddStockModalOpen for consistency
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [isSortOpen, setIsSortOpen] = useState(false)
    const [sortBy, setSortBy] = useState<'name' | 'price' | 'change'>('name')
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc')

    // Close menu on click outside could be implemented here, but for simplicity we'll just toggle for now

    // Handle initial hydration (persist middleware might take a tick)
    const [hydrated, setHydrated] = useState(false)
    useState(() => { setHydrated(true) }) // Simple hydration check, or use useStore hook trick

    const activeList = watchlists.find(w => w.id === activeListId) || watchlists[0]

    // Enrich items with real stock data and apply sorting
    const displayStocks = useMemo(() => {
        if (!activeList) return []

        const enriched = activeList.items.map(item => {
            const stock = stockData.find(s => s.code === item.code)
            return stock ? { ...stock, ...item } : null
        }).filter(Boolean) as (StockSummary & { addedAt: string })[]

        return enriched.sort((a, b) => {
            let comparison = 0
            if (sortBy === 'name') {
                comparison = a.code.localeCompare(b.code)
            } else if (sortBy === 'price') {
                comparison = a.price - b.price
            } else if (sortBy === 'change') {
                comparison = a.changePercent - b.changePercent
            }

            return sortOrder === 'asc' ? comparison : -comparison
        })
    }, [activeList, stockData, sortBy, sortOrder])

    if (!hydrated) return null // Prevent mismatch

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <h1 className="text-3xl font-normal tracking-tight text-text-primary">Your Lists</h1>
                <Button onClick={() => setIsCreateModalOpen(true)} variant="secondary" size="sm">
                    <Plus className="w-4 h-4 mr-2" /> New list
                </Button>
            </div>

            {/* Usage of Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border">
                {watchlists.map(list => (
                    <button
                        key={list.id}
                        onClick={() => setActiveList(list.id)}
                        className={cn(
                            "px-4 py-2 rounded-t-lg text-sm font-bold whitespace-nowrap transition-colors border-b-2",
                            activeListId === list.id
                                ? "text-brand-600 border-brand-600 bg-surface-secondary/30"
                                : "text-text-tertiary border-transparent hover:text-text-secondary hover:bg-surface-secondary/50"
                        )}
                    >
                        {list.name} <span className="ml-1 text-xs opacity-60">({list.items.length})</span>
                    </button>
                ))}
            </div>

            {/* Toolbar */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-text-primary">{activeList?.name}</h2>
                <div className="flex gap-2">
                    <div className="flex items-center gap-2">
                        {/* Sort Dropdown */}
                        <div className="relative">
                            <Button variant="ghost" size="sm" onClick={() => setIsSortOpen(!isSortOpen)} className="gap-2 text-text-secondary">
                                <ArrowUpDown className="w-4 h-4" />
                                <span className="hidden sm:inline">Sort</span>
                            </Button>

                            {isSortOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsSortOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        {[
                                            { label: 'Name (A-Z)', value: 'name', order: 'asc' },
                                            { label: 'Name (Z-A)', value: 'name', order: 'desc' },
                                            { label: 'Price (High-Low)', value: 'price', order: 'desc' },
                                            { label: 'Price (Low-High)', value: 'price', order: 'asc' },
                                            { label: 'Change (High-Low)', value: 'change', order: 'desc' },
                                            { label: 'Change (Low-High)', value: 'change', order: 'asc' },
                                        ].map((option) => (
                                            <button
                                                key={`${option.value}-${option.order}`}
                                                className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center justify-between"
                                                onClick={() => {
                                                    setSortBy(option.value as any)
                                                    setSortOrder(option.order as any)
                                                    setIsSortOpen(false)
                                                }}
                                            >
                                                {option.label}
                                                {sortBy === option.value && sortOrder === option.order && <Check className="w-3 h-3 text-brand-500" />}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="relative">
                            <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                                <MoreHorizontal className="w-4 h-4 text-text-tertiary" />
                            </Button>
                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-surface border border-border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center justify-between"
                                            onClick={() => { setIsRenameModalOpen(true); setIsMenuOpen(false); }}
                                        >
                                            Rename list
                                            <ChevronRight className="w-4 h-4 text-text-tertiary" />
                                        </button>
                                        <button
                                            className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-surface-secondary transition-colors flex items-center justify-between"
                                            onClick={() => { deleteList(activeList.id); setIsMenuOpen(false); }}
                                        >
                                            Delete list
                                            <ChevronRight className="w-4 h-4 text-text-tertiary" />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                    {activeList.items.length > 0 && (
                        <Button onClick={() => setIsAddModalOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" /> Add investments
                        </Button>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="bg-surface rounded-3xl border border-border overflow-hidden min-h-[400px]">
                {displayStocks.length > 0 ? (
                    <div className="divide-y divide-border">
                        {displayStocks.map(stock => (
                            <div key={stock.code} className="group relative">
                                <StockRow stock={stock} className="pr-12" />
                                <button
                                    onClick={() => removeFromList(activeList.id, stock.code)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-text-tertiary hover:text-danger hover:bg-surface-secondary rounded transition-all"
                                    title="Remove from list"
                                >
                                    <span className="sr-only">Remove</span>
                                    ×
                                </button>
                            </div>
                        ))}
                    </div>
                ) : (
                    <WatchlistEmptyState onAdd={() => setIsAddModalOpen(true)} />
                )}
            </div>

            {/* Watchlist News */}
            <div className="mt-8">
                <NewsSection limit={20} title="Watchlist News" />
            </div>

            <CreateListModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={(name) => useWatchlistStore.getState().createList(name)}
            />

            <RenameListModal
                isOpen={isRenameModalOpen}
                onClose={() => setIsRenameModalOpen(false)}
                listId={activeList.id}
                currentName={activeList.name}
            />

            <AddToWatchlistModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                listId={activeList.id}
                allStocks={stockData}
            />
        </div>
    )
}
