
"use client"

import { useState, useMemo } from 'react'
import { IndexDetails, NewsItem } from '@/lib/data'
import { PriceChart } from '@/components/charts/PriceChart'
import { cn, formatPrice } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, Share2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { StockPageActions } from '@/components/stock/StockPageActions'
import { NewsPreview } from '@/components/home/NewsPreview'

interface IndexClientProps {
    index: IndexDetails
    news: NewsItem[]
}

const INDEX_DESCRIPTIONS: Record<string, string> = {
    'MBI10': 'The MBI10 is the main index of the Macedonian Stock Exchange. It consists of the 10 most liquid ordinary shares listed on the MSE. The index is a price index weighted by market capitalization.',
    'OMB': 'The OMB is the bond index of the Macedonian Stock Exchange. It tracks the performance of government and corporate bonds listed on the exchange.'
}

type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

export function IndexClient({ index, news }: IndexClientProps) {
    const [timeframe, setTimeframe] = useState<Timeframe>('1Y')
    const isPositive = index.change >= 0

    // Filter chart data based on timeframe
    const chartData = useMemo(() => {
        // Map history to chart format
        const fullHistory = index.history.map(h => ({
            time: h.date,
            value: h.value
        }))

        // Simple filtering logic (approximate)
        const now = new Date()
        const cutoff = new Date()

        switch (timeframe) {
            case '1D': cutoff.setDate(now.getDate() - 1); break;
            case '5D': cutoff.setDate(now.getDate() - 5); break;
            case '1M': cutoff.setMonth(now.getMonth() - 1); break;
            case '3M': cutoff.setMonth(now.getMonth() - 3); break;
            case '6M': cutoff.setMonth(now.getMonth() - 6); break;
            case 'YTD': cutoff.setMonth(0); cutoff.setDate(1); break;
            case '1Y': cutoff.setFullYear(now.getFullYear() - 1); break;
            case '5Y': cutoff.setFullYear(now.getFullYear() - 5); break;
            case 'MAX': return fullHistory;
        }

        return fullHistory.filter(d => new Date(d.time) >= cutoff)
    }, [index.history, timeframe])

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-1">{index.code}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-text-primary tracking-tight">
                            {formatPrice(index.currentValue)}
                        </span>
                        <div className={cn(
                            "flex items-center px-2 py-1 rounded text-sm font-medium",
                            isPositive
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                        )}>
                            {isPositive ? <ArrowUpRight className="w-4 h-4 mr-1" /> : <ArrowDownRight className="w-4 h-4 mr-1" />}
                            {index.change > 0 ? '+' : ''}{index.change.toFixed(2)} ({index.changePercent.toFixed(2)}%)
                        </div>
                    </div>
                    <div className="text-sm text-text-tertiary mt-2">
                        {new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} · MSE · Disclaimer
                    </div>
                </div>

                <StockPageActions stockCode={index.code} stockData={{
                    code: index.code,
                    company_code: index.code,
                    company_name: index.name, // e.g. MBI10
                    price: index.currentValue,
                    change: index.change,
                    changePercent: index.changePercent
                } as any} />
            </div>

            {/* Main Grid: Chart + Sidebar */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: Chart */}
                <div className="lg:col-span-2 space-y-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                        <div className="h-[450px]">
                            <PriceChart
                                data={chartData}
                                timeframe={timeframe}
                                onTimeframeChange={setTimeframe}
                                excludePeriods={['1D']}
                            />
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & About */}
                <div className="space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>

                    {/* Key Stats Card */}
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                        <h3 className="text-lg font-semibold mb-4 text-text-primary">Key Statistics</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-sm text-text-secondary">Previous Close</span>
                                <span className="font-medium text-text-primary">
                                    {formatPrice(index.currentValue - index.change)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-sm text-text-secondary">Day Range</span>
                                <span className="font-medium text-text-primary">
                                    {index.dayRange ? `${formatPrice(index.dayRange.min)} - ${formatPrice(index.dayRange.max)}` : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-sm text-text-secondary">Year Range</span>
                                <span className="font-medium text-text-primary">
                                    {index.yearRange ? `${formatPrice(index.yearRange.min)} - ${formatPrice(index.yearRange.max)}` : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* About Card */}
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-text-primary">About</h3>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            {INDEX_DESCRIPTIONS[index.name] || 'No description available.'}
                        </p>
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <span className="text-xs text-brand-500 font-medium cursor-pointer hover:underline">Wikipedia</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom: News */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h2 className="text-xl font-semibold mb-6 text-text-primary">In the news</h2>
                <NewsPreview news={news} />
            </div>
        </div>
    )
}
