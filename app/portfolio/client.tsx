
"use client"

import { useState, useMemo, useEffect } from 'react'
import { usePortfolioStore } from "@/lib/stores/portfolio"
import { StockSummary } from "@/lib/types"
import { PortfolioEmptyState } from "@/components/portfolio/PortfolioEmptyState"
import { AddHoldingModal } from "@/components/portfolio/AddHoldingModal"
import { CreatePortfolioModal } from "@/components/portfolio/CreatePortfolioModal"
import { PortfolioChart } from "@/components/portfolio/PortfolioChart"
import { PortfolioHighlights } from "@/components/portfolio/PortfolioHighlights"
import { ResponsiveText } from "@/components/ui/ResponsiveText"
import { Button } from "@/components/ui/Button"
import { Plus, MoreHorizontal, ChevronRight, ChevronDown, ChevronUp, Trash2, Edit2, TrendingUp, TrendingDown, LayoutDashboard, Copy, Settings, BarChart2 } from "lucide-react"
import { cn, formatPrice } from "@/lib/utils"
import Link from 'next/link'
import { RenamePortfolioModal } from "@/components/portfolio/RenamePortfolioModal"
import { PortfolioTreemap } from "@/components/portfolio/PortfolioTreemap"
import { SortMenu, SortField, SortDirection } from "@/components/portfolio/SortMenu"
import { NewsSection } from "@/components/common/NewsSection"

interface PortfolioPageProps {
    stockData: StockSummary[]
}

export function PortfolioClient({ stockData }: PortfolioPageProps) {
    const { portfolios, activePortfolioId, setActivePortfolio, removeHolding, createPortfolio, deletePortfolio, renamePortfolio, copyPortfolio } = usePortfolioStore()

    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const [isRenameModalOpen, setIsRenameModalOpen] = useState(false)
    const [isTreemapOpen, setIsTreemapOpen] = useState(false)
    const [isMenuOpen, setIsMenuOpen] = useState(false)
    const [hydrated, setHydrated] = useState(false)
    const [activeTab, setActiveTab] = useState<'investments' | 'news'>('investments')
    const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

    // New Feature States
    const [initialStockCode, setInitialStockCode] = useState<string | undefined>(undefined)
    const [sortField, setSortField] = useState<SortField>('marketValue')
    const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

    useEffect(() => {
        setHydrated(true)
        if (hydrated && !activePortfolioId && portfolios.length > 0) {
            setActivePortfolio(portfolios[0].id)
        }
    }, [hydrated, activePortfolioId, portfolios, setActivePortfolio])

    const activePortfolio = portfolios.find(p => p.id === activePortfolioId) || portfolios[0]

    const toggleRow = (code: string) => {
        const newExpanded = new Set(expandedRows)
        if (newExpanded.has(code)) {
            newExpanded.delete(code)
        } else {
            newExpanded.add(code)
        }
        setExpandedRows(newExpanded)
    }

    const handleAddInvestment = (code?: string) => {
        setInitialStockCode(code)
        setIsAddModalOpen(true)
    }

    // Process Holdings into Groups
    const processedData = useMemo(() => {
        if (!activePortfolio) return { enrichedHoldings: [], groups: [], totals: { marketValue: 0, costBasis: 0, totalGain: 0, dailyGain: 0, dailyGainPercent: 0 } }

        const enriched = activePortfolio.holdings.map(holding => {
            const stock = stockData.find(s => s.code === holding.code)
            if (!stock) return null

            const marketValue = stock.price * holding.quantity
            const costBasis = holding.buyPrice * holding.quantity
            const totalGain = marketValue - costBasis
            const returnPercent = costBasis > 0 ? (totalGain / costBasis) * 100 : 0
            const dailyGain = (stock.change || 0) * holding.quantity

            return {
                ...holding,
                stockName: stock.name,
                currentPrice: stock.price,
                change: stock.change,
                changePercent: stock.changePercent,
                marketValue,
                costBasis,
                totalGain,
                returnPercent,
                dailyGain
            }
        }).filter(Boolean) as (typeof activePortfolio.holdings[0] & {
            stockName: string,
            currentPrice: number,
            change: number,
            changePercent: number,
            marketValue: number,
            costBasis: number,
            totalGain: number,
            returnPercent: number,
            dailyGain: number
        })[]

        // Group by Stock Code
        let groups = Object.values(enriched.reduce((acc, item) => {
            if (!acc[item.code]) {
                acc[item.code] = {
                    code: item.code,
                    name: item.stockName,
                    price: item.currentPrice,
                    change: item.change,
                    changePercent: item.changePercent,
                    quantity: 0,
                    marketValue: 0,
                    dailyGain: 0,
                    totalGain: 0,
                    holdings: []
                }
            }
            const group = acc[item.code]
            group.quantity += item.quantity
            group.marketValue += item.marketValue
            group.dailyGain += item.dailyGain
            group.totalGain += item.totalGain
            group.holdings.push(item)
            return acc
        }, {} as Record<string, {
            code: string,
            name: string,
            price: number,
            change: number,
            changePercent: number,
            quantity: number,
            marketValue: number,
            dailyGain: number,
            totalGain: number,
            holdings: typeof enriched
        }>))

        // Sort Groups
        groups.sort((a, b) => {
            let valA: any = a[sortField as keyof typeof a]
            let valB: any = b[sortField as keyof typeof b]

            // Handle string vs number
            if (typeof valA === 'string') valA = valA.toLowerCase()
            if (typeof valB === 'string') valB = valB.toLowerCase()

            if (valA < valB) return sortDirection === 'asc' ? -1 : 1
            if (valA > valB) return sortDirection === 'asc' ? 1 : -1
            return 0
        })

        const totals = enriched.reduce<{
            marketValue: number
            costBasis: number
            totalGain: number
            dailyGain: number
            dailyGainPercent: number
        }>((acc, h) => ({
            marketValue: acc.marketValue + h.marketValue,
            costBasis: acc.costBasis + h.costBasis,
            totalGain: acc.totalGain + h.totalGain,
            dailyGain: acc.dailyGain + h.dailyGain,
            dailyGainPercent: 0
        }), { marketValue: 0, costBasis: 0, totalGain: 0, dailyGain: 0, dailyGainPercent: 0 })

        const prevValue = totals.marketValue - totals.dailyGain
        totals.dailyGainPercent = prevValue > 0 ? (totals.dailyGain / prevValue) * 100 : 0

        return { enrichedHoldings: enriched, groups, totals }
    }, [activePortfolio, stockData, sortField, sortDirection])

    const { enrichedHoldings, groups, totals } = processedData

    const totalReturnPercent = totals.costBasis > 0 ? (totals.totalGain / totals.costBasis) * 100 : 0
    const previousDayValue = totals.marketValue - totals.dailyGain
    const dailyReturnPercent = previousDayValue > 0 ? (totals.dailyGain / previousDayValue) * 100 : 0


    if (!hydrated) return null

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
            {/* Header & Tabs */}
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                    {portfolios.map(p => (
                        <button
                            key={p.id}
                            onClick={() => setActivePortfolio(p.id)}
                            className={cn(
                                "text-sm font-medium px-4 py-2 rounded-full transition-all whitespace-nowrap border",
                                activePortfolioId === p.id
                                    ? "bg-brand-100 text-brand-700 border-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-800"
                                    : "bg-surface border-border text-text-secondary hover:bg-surface-secondary"
                            )}
                        >
                            {p.name}
                        </button>
                    ))}
                    <Button variant="ghost" size="sm" onClick={() => setIsCreateModalOpen(true)} className="text-brand-500 hover:text-brand-600 font-medium whitespace-nowrap">
                        + New portfolio
                    </Button>
                </div>

                <div className="flex justify-between items-start">
                    <div>
                        <h1 className="text-3xl font-normal text-text-primary mb-1">{activePortfolio?.name}</h1>
                        <div className="flex items-baseline gap-4 flex-wrap">
                            <ResponsiveText baseSize="text-5xl" className="font-medium tracking-tight">
                                {formatPrice(totals.marketValue)}
                            </ResponsiveText>

                            <div className={cn(
                                "flex items-center gap-2 px-3 py-1 rounded-lg font-medium",
                                totals.dailyGain >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                            )}>
                                {totals.dailyGain >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                                {totals.dailyGainPercent?.toFixed(2)}%
                            </div>

                            <div className={cn("font-medium", totals.dailyGain >= 0 ? "text-success" : "text-danger")}>
                                {totals.dailyGain > 0 ? '+' : ''}{formatPrice(totals.dailyGain)} Today
                            </div>
                        </div>
                    </div>
                    <div className="relative">
                        <Button variant="ghost" size="icon" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                            <MoreHorizontal className="w-5 h-5 text-text-tertiary" />
                        </Button>
                        {isMenuOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
                                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            setIsRenameModalOpen(true)
                                            setIsMenuOpen(false)
                                        }}
                                    >
                                        <Edit2 className="w-4 h-4" /> Rename portfolio
                                    </button>
                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            copyPortfolio(activePortfolio.id)
                                            setIsMenuOpen(false)
                                        }}
                                    >
                                        <Copy className="w-4 h-4" /> Copy portfolio
                                    </button>

                                    <div className="h-px bg-border my-1" />

                                    <button
                                        className="w-full text-left px-4 py-2 text-sm text-danger hover:bg-danger/10 transition-colors flex items-center gap-2"
                                        onClick={() => {
                                            deletePortfolio(activePortfolio.id)
                                            setIsMenuOpen(false)
                                        }}
                                        disabled={portfolios.length <= 1}
                                    >
                                        <Trash2 className="w-4 h-4" /> Delete portfolio
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Dashboard Grid */}
            {enrichedHoldings.length > 0 ? (
                <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        <div className="lg:col-span-2">
                            <div className="h-[400px]">
                                <PortfolioChart holdings={enrichedHoldings} />
                            </div>
                        </div>

                        <div>
                            <PortfolioHighlights
                                dailyGain={totals.dailyGain}
                                dailyGainPercent={dailyReturnPercent}
                                totalGain={totals.totalGain}
                                totalGainPercent={totalReturnPercent}
                            />
                        </div>
                    </div>

                    {/* Tabs / Spacing Gap */}
                    <div className="pt-8">
                        <div className="border-b border-border">
                            <div className="flex gap-6">
                                {(['investments', 'news'] as const).map(tab => (
                                    <button
                                        key={tab}
                                        onClick={() => setActiveTab(tab)}
                                        className={cn(
                                            "pb-3 text-sm font-medium border-b-2 transition-colors capitalize",
                                            activeTab === tab
                                                ? "border-brand-500 text-brand-600 dark:text-brand-400"
                                                : "border-transparent text-text-secondary hover:text-text-primary"
                                        )}
                                    >
                                        {tab === 'news' ? 'News and events' : tab}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* News Tab */}
                        {activeTab === 'news' && (
                            <div className="pt-6">
                                <NewsSection limit={20} title="Portfolio News" />
                            </div>
                        )}

                        {/* Investments Table */}
                        {activeTab === 'investments' && (
                            <div className="space-y-4 pt-6">
                                <div className="flex justify-end gap-2 items-center">
                                    <SortMenu sortField={sortField} sortDirection={sortDirection} onSortChange={(f, d) => {
                                        setSortField(f)
                                        setSortDirection(d)
                                    }} />
                                    <Button variant="outline" size="sm" className="text-brand-500" onClick={() => setIsTreemapOpen(true)}>
                                        <BarChart2 className="w-4 h-4 mr-1" /> Visualize
                                    </Button>
                                    <Button size="sm" onClick={() => handleAddInvestment()}>
                                        <Plus className="w-4 h-4 mr-1" /> Investment
                                    </Button>
                                </div>

                                <div className="bg-surface rounded-3xl border border-border overflow-hidden">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="border-b border-border bg-surface-secondary/30">
                                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider">Symbol</th>
                                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Price</th>
                                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Quantity</th>
                                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Day Gain</th>
                                                <th className="p-4 text-xs font-bold text-text-secondary uppercase tracking-wider text-right">Value</th>
                                                <th className="p-4 w-10"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {groups.map(group => (
                                                <>
                                                    <tr
                                                        key={group.code}
                                                        className="group hover:bg-surface-secondary/50 transition-colors border-b border-border/50 last:border-0"
                                                    >
                                                        <td className="p-4">
                                                            <Link href={`/stock/${group.code}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity w-fit">
                                                                <div className="font-bold text-sm bg-brand-500 text-white px-2 py-1 rounded text-xs">{group.code}</div>
                                                                <div className="font-medium text-text-primary">{group.name}</div>
                                                            </Link>
                                                        </td>
                                                        <td className="p-4 text-right font-mono text-sm">{formatPrice(group.price)}</td>
                                                        <td className="p-4 text-right font-mono text-sm">{group.quantity}</td>
                                                        <td className="p-4 text-right">
                                                            <div className={cn("text-sm font-medium", group.dailyGain >= 0 ? "text-success" : "text-danger")}>
                                                                {group.dailyGain > 0 ? '+' : ''}{formatPrice(group.dailyGain)}
                                                                <span className="text-xs ml-1 opacity-80">({group.changePercent.toFixed(2)}%)</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-right font-mono font-bold text-text-primary">
                                                            {formatPrice(group.marketValue)}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <button
                                                                onClick={() => toggleRow(group.code)}
                                                                className="p-2 hover:bg-surface-tertiary rounded-full transition-colors text-text-tertiary hover:text-text-primary"
                                                            >
                                                                {expandedRows.has(group.code) ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandedRows.has(group.code) && (
                                                        <tr className="bg-surface-secondary/20 animate-in fade-in slide-in-from-top-1 duration-200">
                                                            <td colSpan={6} className="p-0">
                                                                <div className="py-2 px-4 space-y-2 border-b border-border">
                                                                    <div className="grid grid-cols-12 gap-4 text-xs font-bold text-text-tertiary px-4 py-2 uppercase">
                                                                        <div className="col-span-3">Purchase Date</div>
                                                                        <div className="text-right col-span-2">Purchase Price</div>
                                                                        <div className="text-right col-span-1">Quantity</div>
                                                                        <div className="text-right col-span-3">Total Gain</div>
                                                                        <div className="text-right col-span-3">Value</div>
                                                                    </div>
                                                                    {group.holdings.map(holding => (
                                                                        <div key={holding.id} className="grid grid-cols-12 gap-4 text-sm px-4 py-2 hover:bg-surface-secondary/50 rounded-lg group/item items-center">
                                                                            <div className="col-span-3 font-medium">{new Date(holding.buyDate).toLocaleDateString()}</div>
                                                                            <div className="text-right font-mono col-span-2">{formatPrice(holding.buyPrice)}</div>
                                                                            <div className="text-right font-mono col-span-1">{holding.quantity}</div>
                                                                            <div className={cn("text-right font-mono flex flex-col items-end col-span-3", holding.totalGain >= 0 ? "text-success" : "text-danger")}>
                                                                                <span>{holding.totalGain > 0 ? '+' : ''}{formatPrice(holding.totalGain)}</span>
                                                                                <span className="text-xs opacity-80">({holding.returnPercent.toFixed(2)}%)</span>
                                                                            </div>
                                                                            <div className="text-right font-mono flex items-center justify-end gap-2 col-span-3">
                                                                                {formatPrice(holding.marketValue)}
                                                                                <button
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation()
                                                                                        removeHolding(activePortfolio.id, holding.id)
                                                                                    }}
                                                                                    className="opacity-0 group-hover/item:opacity-100 p-1.5 text-text-tertiary hover:text-danger hover:bg-surface-tertiary rounded transition-all flex-shrink-0"
                                                                                    title="Delete purchase"
                                                                                >
                                                                                    <Trash2 className="w-3.5 h-3.5" />
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                    <div className="px-4 py-3">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="sm"
                                                                            className="text-brand-500 hover:text-brand-600 -ml-2"
                                                                            onClick={() => handleAddInvestment(group.code)}
                                                                        >
                                                                            <Plus className="w-4 h-4 mr-1" /> Record another purchase
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                <PortfolioEmptyState onAdd={() => handleAddInvestment()} />
            )}

            <AddHoldingModal
                isOpen={isAddModalOpen}
                onClose={() => {
                    setIsAddModalOpen(false)
                    setInitialStockCode(undefined)
                }}
                allStocks={stockData}
                portfolioId={activePortfolioId || undefined}
                initialStockCode={initialStockCode}
            />
            <CreatePortfolioModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={(name) => createPortfolio(name)}
            />
            {activePortfolio && (
                <>
                    <RenamePortfolioModal
                        isOpen={isRenameModalOpen}
                        onClose={() => setIsRenameModalOpen(false)}
                        onRename={(name) => renamePortfolio(activePortfolio.id, name)}
                        currentName={activePortfolio.name}
                    />
                    <PortfolioTreemap
                        isOpen={isTreemapOpen}
                        onClose={() => setIsTreemapOpen(false)}
                        holdings={groups.map(g => ({
                            code: g.code,
                            stockName: g.name,
                            marketValue: g.marketValue,
                            changePercent: g.changePercent
                        }))}
                    />
                </>
            )}
        </div>
    )
}
