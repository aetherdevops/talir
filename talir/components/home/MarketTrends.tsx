"use client"

import { useState } from 'react'
import { StockSummary } from "@/lib/types"
import { StockRow } from "@/components/stock/StockRow"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface MarketTrendsProps {
    gainers: StockSummary[]
    losers: StockSummary[]
    mostActive: StockSummary[]
}

type Tab = 'gainers' | 'losers' | 'active'

export function MarketTrends({ gainers, losers, mostActive }: MarketTrendsProps) {
    const [activeTab, setActiveTab] = useState<Tab>('active')

    const getStocks = () => {
        switch (activeTab) {
            case 'gainers': return gainers
            case 'losers': return losers
            case 'active': return mostActive
            default: return mostActive
        }
    }

    return (
        <Card className="rounded-3xl shadow-card border border-border overflow-hidden">
            <CardHeader className="border-b border-border px-6 py-4 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-normal text-text-primary">Market Trends</h2>
                </div>
                <div className="flex p-1 bg-surface-secondary/50 rounded-xl">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                            activeTab === 'active'
                                ? "bg-surface shadow text-brand-text"
                                : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('gainers')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                            activeTab === 'gainers'
                                ? "bg-surface shadow text-brand-text"
                                : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        Gainers
                    </button>
                    <button
                        onClick={() => setActiveTab('losers')}
                        className={cn(
                            "flex-1 py-1.5 text-xs font-bold rounded-lg transition-all",
                            activeTab === 'losers'
                                ? "bg-surface shadow text-brand-text"
                                : "text-text-tertiary hover:text-text-secondary"
                        )}
                    >
                        Losers
                    </button>
                </div>
            </CardHeader>
            <div className="bg-surface">
                {getStocks().map((stock) => (
                    <StockRow key={stock.code} stock={stock} className="py-3 px-6" />
                ))}
                {getStocks().length === 0 && (
                    <div className="p-6 text-center text-sm text-text-tertiary">
                        No data available
                    </div>
                )}
            </div>
            <div className="p-3 border-t border-border bg-surface-secondary/30">
                <Link
                    href={
                        activeTab === 'gainers' ? '/markets?sort=change&order=desc' :
                            activeTab === 'losers' ? '/markets?sort=change&order=asc' :
                                '/markets?sort=volume'
                    }
                    className="w-full block"
                >
                    <Button variant="ghost" size="sm" className="w-full text-brand-text font-bold text-xs uppercase tracking-wider">
                        View Full Market
                    </Button>
                </Link>
            </div>
        </Card>
    )
}
