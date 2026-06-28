"use client"

import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Plus, Check, MoreHorizontal, Briefcase, Eye, ChevronDown, Bell, Share2 } from 'lucide-react'
import { useWatchlistStore } from '@/lib/stores/watchlist'
import { usePortfolioStore } from '@/lib/stores/portfolio'
import { CreateListModal } from '@/components/watchlist/CreateListModal'
import { CreatePortfolioModal } from '@/components/portfolio/CreatePortfolioModal'
import { AddHoldingModal } from '@/components/portfolio/AddHoldingModal'
import { AddAlertModal } from './AddAlertModal'
import { cn } from '@/lib/utils'
import { StockSummary } from '@/lib/types'

interface StockPageActionsProps {
    stockCode: string
    stockData?: StockSummary
    variant?: 'default' | 'icon'
    className?: string
}

export function StockPageActions({ stockCode, stockData, variant = 'default', className }: StockPageActionsProps) {
    const { watchlists, addToList, removeFromList, isInList, createList } = useWatchlistStore()
    const { portfolios, createPortfolio } = usePortfolioStore()

    const [isWatchlistDropdownOpen, setIsWatchlistDropdownOpen] = useState(false)
    const [isPortfolioDropdownOpen, setIsPortfolioDropdownOpen] = useState(false)

    // ... (rest of state logic usually same, check hook usage)

    const [isCreateListModalOpen, setIsCreateListModalOpen] = useState(false)
    const [isCreatePortfolioModalOpen, setIsCreatePortfolioModalOpen] = useState(false)
    const [isAddHoldingModalOpen, setIsAddHoldingModalOpen] = useState(false)
    const [isAddAlertModalOpen, setIsAddAlertModalOpen] = useState(false)
    const [selectedPortfolioId, setSelectedPortfolioId] = useState<string | undefined>(undefined)

    const handleWatchlistToggle = (listId: string) => {
        if (isInList(listId, stockCode)) {
            removeFromList(listId, stockCode)
        } else {
            addToList(listId, stockCode)
        }
    }

    const handleOpenAddHolding = (portfolioId: string) => {
        setSelectedPortfolioId(portfolioId)
        setIsAddHoldingModalOpen(true)
        setIsPortfolioDropdownOpen(false)
    }

    const handleShare = (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()
        const url = window.location.origin + (stockData?.type === 'Index' ? `/market/${stockCode}` : `/stock/${stockCode}`)
        navigator.clipboard.writeText(url)
        // Ideally show toast here
        alert('Link copied to clipboard')
    }

    // Prepare mock data for AddHoldingModal and AlertModal if stockData is missing (fallback)
    const mockStockDataForModal: StockSummary[] = stockData ? [stockData] : [{
        code: stockCode,
        company_code: stockCode,
        company_name: stockCode,
        price: 0,
        change: 0,
        changePercent: 0,
        type: 'Stock'
    } as any]

    const currentPrice = stockData?.price || 0

    return (
        <div className={cn("flex items-center gap-2", className)}>
            {/* Watchlist Action */}
            <div className="relative">
                <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                        "gap-2",
                        variant === 'icon' && "p-2 h-8 w-8 hover:bg-surface-tertiary"
                    )}
                    onClick={(e) => {
                        e.preventDefault() // Important if inside Link
                        e.stopPropagation()
                        setIsWatchlistDropdownOpen(!isWatchlistDropdownOpen)
                    }}
                    title="Add to Watchlist"
                >
                    <Eye className="h-4 w-4" />
                    {variant === 'default' && (
                        <>
                            <span className="hidden sm:inline">Add to Watchlist</span>
                            <ChevronDown className="h-3 w-3" />
                        </>
                    )}
                </Button>

                {isWatchlistDropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsWatchlistDropdownOpen(false); }} />
                        <div
                            className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <div className="px-4 py-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">Add to Watchlist</div>
                            {watchlists.map(list => {
                                const isAdded = isInList(list.id, stockCode)
                                return (
                                    <button
                                        key={list.id}
                                        className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center justify-between group"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleWatchlistToggle(list.id)
                                        }}
                                    >
                                        <span className="truncate pr-2">{list.name}</span>
                                        <div className={cn(
                                            "w-5 h-5 rounded border flex items-center justify-center transition-colors",
                                            isAdded
                                                ? "bg-brand-500 border-brand-500 text-white"
                                                : "border-border group-hover:border-brand-500 text-transparent"
                                        )}>
                                            <Check className="h-3.5 w-3.5" />
                                        </div>
                                    </button>
                                )
                            })}
                            <div className="h-px bg-border my-1" />
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-brand-500 hover:bg-surface-secondary hover:text-brand-600 transition-colors font-medium flex items-center gap-2"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsCreateListModalOpen(true)
                                    setIsWatchlistDropdownOpen(false)
                                }}
                            >
                                <Plus className="h-4 w-4" /> New watchlist
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Portfolio Action */}
            <div className="relative">
                <Button
                    variant="secondary"
                    size="sm"
                    className={cn(
                        "gap-2",
                        variant === 'icon' && "p-2 h-8 w-8 hover:bg-surface-tertiary"
                    )}
                    onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        setIsPortfolioDropdownOpen(!isPortfolioDropdownOpen)
                    }}
                    title="Add to Portfolio"
                >
                    <Briefcase className="h-4 w-4" />
                    {variant === 'default' && (
                        <>
                            <span className="hidden sm:inline">Add to Portfolio</span>
                            <ChevronDown className="h-3 w-3" />
                        </>
                    )}
                </Button>

                {isPortfolioDropdownOpen && (
                    <>
                        <div className="fixed inset-0 z-10" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsPortfolioDropdownOpen(false); }} />
                        <div
                            className="absolute right-0 top-full mt-2 w-64 bg-surface border border-border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                        >
                            <div className="px-4 py-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">Add to Portfolio</div>
                            {portfolios.length > 0 ? (
                                portfolios.map(p => (
                                    <button
                                        key={p.id}
                                        className="w-full text-left px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors flex items-center justify-between group"
                                        onClick={(e) => {
                                            e.preventDefault()
                                            e.stopPropagation()
                                            handleOpenAddHolding(p.id)
                                        }}
                                    >
                                        <span className="truncate">{p.name}</span>
                                        <Plus className="h-4 w-4 text-text-tertiary group-hover:text-brand-500" />
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-2 text-sm text-text-tertiary italic">No portfolios created</div>
                            )}
                            <div className="h-px bg-border my-1" />
                            <button
                                className="w-full text-left px-4 py-2 text-sm text-brand-500 hover:bg-surface-secondary hover:text-brand-600 transition-colors font-medium flex items-center gap-2"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    setIsCreatePortfolioModalOpen(true)
                                    setIsPortfolioDropdownOpen(false)
                                }}
                            >
                                <Plus className="h-4 w-4" /> New portfolio
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* Alert Action */}
            <Button
                variant="secondary"
                size="sm"
                className={cn(
                    "gap-2",
                    variant === 'icon' && "p-2 h-8 w-8 hover:bg-surface-tertiary"
                )}
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setIsAddAlertModalOpen(true)
                }}
                title="Set Alert"
            >
                <Bell className="h-4 w-4" />
                {variant === 'default' && <span className="hidden sm:inline">Add Alert</span>}
            </Button>

            {/* Share Action */}
            <Button
                variant="secondary"
                size="sm"
                className={cn(
                    "gap-2",
                    variant === 'icon' && "p-2 h-8 w-8 hover:bg-surface-tertiary"
                )}
                onClick={handleShare}
                title="Share"
            >
                <Share2 className="h-4 w-4" />
                {variant === 'default' && <span className="hidden sm:inline">Share</span>}
            </Button>

            <CreateListModal
                isOpen={isCreateListModalOpen}
                onClose={() => setIsCreateListModalOpen(false)}
                onCreate={(name) => createList(name)}
            />

            <CreatePortfolioModal
                isOpen={isCreatePortfolioModalOpen}
                onClose={() => setIsCreatePortfolioModalOpen(false)}
                onCreate={(name) => createPortfolio(name)}
            />

            <AddHoldingModal
                isOpen={isAddHoldingModalOpen}
                onClose={() => {
                    setIsAddHoldingModalOpen(false)
                    setSelectedPortfolioId(undefined)
                }}
                allStocks={stockCode ? mockStockDataForModal : []}
                portfolioId={selectedPortfolioId}
                initialStockCode={stockCode}
            />

            <AddAlertModal
                isOpen={isAddAlertModalOpen}
                onClose={() => setIsAddAlertModalOpen(false)}
                symbol={stockCode}
                currentPrice={currentPrice}
            />
        </div>
    )
}
