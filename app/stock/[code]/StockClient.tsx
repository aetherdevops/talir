"use client"

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowLeft, Star, Bell, Share2, Globe, Phone, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { PriceChangeBadge } from '@/components/ui/Badge'
import { ClientPriceChart } from '@/components/charts/ClientPriceChart'
import { formatPrice, formatInteger, formatDecimal, cn } from '@/lib/utils'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { StockPageActions } from '@/components/stock/StockPageActions'
import { StickyStockHeader } from '@/components/stock/StickyStockHeader'
import { usePreferencesStore, type ChartRange } from '@/lib/stores/preferences'
import { PortfolioHoldingIndicator } from '@/components/portfolio/PortfolioHoldingIndicator'
import { StockFilingsSection } from '@/components/stock/StockFilingsSection'
import { ResponsiveText } from '@/components/ui/ResponsiveText'
import { StockSummary, DailyPrice, NewsItem } from '@/lib/types'
import { UPDATES_SECTION_TITLE } from '@/lib/news-style'

// Replicate the ChartData interface locally or import it
interface ChartData {
    time: string
    value: number
    volume?: number
}

interface StockClientProps {
    stock: any
    history: DailyPrice[]
    currentPrice: number
    chartData: ChartData[]
    filingsDated: NewsItem[]
    filingsUndated: NewsItem[]
    asOfDate: string
}

type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

function chartRangeToTimeframe(range: ChartRange): Timeframe {
    return range as Timeframe
}

export function StockClient({ stock, history, currentPrice, chartData, filingsDated, filingsUndated, asOfDate }: StockClientProps) {
    const defaultChartRange = usePreferencesStore((s) => s.defaultChartRange)
    const [timeframe, setTimeframe] = useState<Timeframe>(() => chartRangeToTimeframe(defaultChartRange))

    // Filter Logic with Index-based fallback for short periods to ensure data display
    const filteredData = useMemo(() => {
        if (!chartData.length) return []
        const now = new Date()

        switch (timeframe) {
            case '1D':
                // Show last 2 points to create a line segment if possible, or just last 1
                return chartData.slice(-2)
            case '5D':
                // Last 5 trading days
                return chartData.slice(-5)
            case '1M':
                // Approx 22 trading days
                return chartData.slice(-22)
            case '3M':
                // Approx 66 trading days
                return chartData.slice(-66)
            case '6M':
                // Approx 132 trading days
                return chartData.slice(-132)
            case 'YTD':
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                return chartData.filter(d => new Date(d.time) >= startOfYear)
            case '1Y':
                const oneYearAgo = new Date();
                oneYearAgo.setFullYear(now.getFullYear() - 1);
                return chartData.filter(d => new Date(d.time) >= oneYearAgo)
            case '5Y':
                const fiveYearsAgo = new Date();
                fiveYearsAgo.setFullYear(now.getFullYear() - 5);
                return chartData.filter(d => new Date(d.time) >= fiveYearsAgo)
            case 'MAX':
                return chartData;
            default:
                return chartData
        }
    }, [chartData, timeframe])

    // Calculate Dynamic Stats
    const displayStats = useMemo(() => {
        // Default to "Daily" stats if 1D or logic fails
        const latestHistory = stock.history[stock.history.length - 1] || {}
        let change = latestHistory.percent_change || 0
        let absChange = (currentPrice * change) / 100
        let label = "Today"

        if (timeframe !== '1D' && filteredData.length > 0) {
            const first = filteredData[0]
            const last = filteredData[filteredData.length - 1] // or currentPrice

            // Should accurate calculation use currentPrice as the "latest"?
            const latestVal = currentPrice
            const startVal = first.value

            if (startVal !== 0) {
                absChange = latestVal - startVal
                change = (absChange / startVal) * 100
            }

            // Set Label based on timeframe
            if (timeframe === 'YTD') label = 'Year-to-Date'
            else if (timeframe === 'MAX') label = 'All Time'
            else label = timeframe
        } else if (timeframe === '1D') {
            // Keep default daily calc
            const latest = history[history.length - 1] || {}
            change = latest.percent_change || 0
            absChange = (currentPrice * change) / 100
        }

        return { change, absChange, label }
    }, [timeframe, filteredData, currentPrice, stock, history])

    // Derived Stats for Sidebar
    const latest = history[history.length - 1] || {}
    const low = latest.min_price
    const high = latest.max_price
    const volume = latest.quantity
    const turnover = latest.total_turnover_mkd
    const avgPrice = latest.average_price

    // 52 Week Range calc (could be outside, but fast enough here)
    const yearLow = useMemo(() => {
        const yearData = chartData.filter(d => {
            const cut = new Date(); cut.setFullYear(cut.getFullYear() - 1);
            return new Date(d.time) >= cut
        })
        return yearData.length ? Math.min(...yearData.map(d => d.value)) : 0
    }, [chartData])

    const yearHigh = useMemo(() => {
        const yearData = chartData.filter(d => {
            const cut = new Date(); cut.setFullYear(cut.getFullYear() - 1);
            return new Date(d.time) >= cut
        })
        return yearData.length ? Math.max(...yearData.map(d => d.value)) : 0
    }, [chartData])


    return (
        <div className="flex flex-col gap-6 animate-fade-in w-full max-w-[1600px] mx-auto min-w-0">
            {/* Breadcrumb / Back */}
            <Link href="/" className="flex items-center gap-2 text-sm text-text-tertiary hover:text-text-primary transition-colors w-fit">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Overview</span>
            </Link>

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-6">
                <div className="flex flex-col gap-2">
                    <div className="flex flex-col gap-1 items-start">
                        <div className="bg-brand-active/10 text-brand-text px-2 py-0.5 rounded text-xs font-bold tracking-wider uppercase border border-brand-active/20">
                            {stock.company_code}
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold text-text-primary tracking-tight leading-tight">
                            {stock.company_name}
                        </h1>
                    </div>
                    <div className="flex items-end gap-4 mt-2">
                        <span className="text-4xl font-mono font-bold text-text-primary tracking-tighter">
                            {formatPrice(currentPrice)}
                        </span>
                        <div className="mb-1.5 flex items-center gap-2 flex-wrap">
                            <PriceChangeBadge change={displayStats.change} className="scale-110 origin-left" />
                            <span className="text-sm text-text-tertiary font-data">
                                ({displayStats.absChange > 0 ? '+' : ''}{formatDecimal(displayStats.absChange)} ден.) {displayStats.label}
                            </span>
                        </div>
                    </div>
                    <DataFreshnessLabel asOfDate={asOfDate} />
                    <span className="text-xs text-text-tertiary">
                        Last trade: {latest.date} • {stock.sector ? stock.sector : 'Market: MSE'}
                    </span>
                </div>

                {/* Actions */}
                <StockPageActions
                    stockCode={stock.company_code}
                    stockData={{
                        code: stock.company_code,
                        name: stock.company_name,
                        price: currentPrice,
                        change: displayStats.absChange,
                        changePercent: displayStats.change,
                        volume: volume || 0,
                        turnover: turnover || 0,
                        date: new Date().toISOString()
                    }}
                />
            </div>

            <StickyStockHeader
                code={stock.company_code}
                name={stock.company_name}
                price={currentPrice}
                changePercent={displayStats.change}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Chart Section (2/3 width) */}
                <div className="lg:col-span-2 space-y-6">


                    <Card className="p-1 border-none shadow-none bg-transparent lg:bg-surface lg:shadow-card lg:border lg:border-border">
                        <CardHeader className="px-0 pt-0 lg:px-6 lg:pt-6 border-none pb-2">
                            <h2 className="text-lg font-bold text-text-primary">Price Performance</h2>
                        </CardHeader>
                        <CardContent className="px-0 lg:px-6 pb-0 lg:pb-6 min-h-[450px]">
                            <ClientPriceChart
                                data={filteredData} // Passing Pre-Filtered Data
                                timeframe={timeframe}
                                onTimeframeChange={setTimeframe}
                            // We might need to tell PriceChart NOT to filter internally if we pass pre-filtered data
                            // But keeping PriceChart dump is better.
                            />
                        </CardContent>
                    </Card>

                    {/* Filings */}
                    <div className="flex flex-col gap-4">
                        <h2 className="text-lg font-semibold text-text-primary font-heading border-b border-border pb-3">
                            {UPDATES_SECTION_TITLE}
                        </h2>
                        <StockFilingsSection dated={filingsDated} undated={filingsUndated} />
                    </div>
                </div>

                {/* Right Sidebar (Stats & Info) */}
                <div className="flex flex-col gap-6">
                    <PortfolioHoldingIndicator stockCode={stock.company_code} currentPrice={currentPrice} />

                    <Card>
                        <CardHeader>
                            <h2 className="text-lg font-bold text-text-primary">Key Statistics</h2>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Previous Close Calculation */}
                            {history.length > 1 && (
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-xs text-text-secondary">Previous Close</span>
                                    <span className="text-xs font-mono font-medium text-text-primary">
                                        {formatPrice(history[history.length - 2]?.last_transaction_price || 0)}
                                    </span>
                                </div>
                            )}

                            {low !== null && high !== null && (
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-xs text-text-secondary">Day Range</span>
                                    <span className="text-xs font-mono font-medium text-text-primary whitespace-nowrap">
                                        {formatPrice(low)} - {formatPrice(high)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-xs text-text-secondary">52 Week Range</span>
                                <span className="text-xs font-mono font-medium text-text-primary whitespace-nowrap">
                                    {formatPrice(yearLow)} - {formatPrice(yearHigh)}
                                </span>
                            </div>

                            {avgPrice > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-xs text-text-secondary">Average Price</span>
                                    <span className="text-xs font-mono font-medium text-text-primary">
                                        {formatPrice(avgPrice)}
                                    </span>
                                </div>
                            )}

                            {volume > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-xs text-text-secondary">Volume</span>
                                    <span className="text-xs font-mono font-medium text-text-primary">
                                        {formatInteger(volume)}
                                    </span>
                                </div>
                            )}

                            {turnover > 0 && (
                                <div className="flex justify-between items-center py-2 border-b border-border/50">
                                    <span className="text-xs text-text-secondary">Turnover</span>
                                    <span className="text-xs font-mono font-medium text-text-primary">
                                        {formatPrice(turnover)}
                                    </span>
                                </div>
                            )}

                            <div className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                                <span className="text-xs text-text-secondary">First Trade</span>
                                <span className="text-xs font-medium text-text-primary">
                                    {stock.first_trade_date}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Company Info */}
                    {(stock.issuer_data?.address || stock.issuer_data?.phone || stock.issuer_data?.website) && (
                        <Card>
                            <CardHeader>
                                <h2 className="text-lg font-bold text-text-primary">Company Info</h2>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {stock.issuer_data.address && (
                                    <div className="text-sm text-text-secondary">
                                        <p className="font-medium text-text-primary mb-1">Address</p>
                                        {stock.issuer_data.address}, {stock.issuer_data.city}
                                    </div>
                                )}

                                {stock.issuer_data.phone && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Phone className="h-4 w-4 text-text-tertiary" />
                                        <a href={`tel:${stock.issuer_data.phone}`} className="text-text-primary hover:text-brand-500 hover:underline transition-colors">
                                            {stock.issuer_data.phone}
                                        </a>
                                    </div>
                                )}

                                {stock.issuer_data.website && (
                                    <div className="flex items-center gap-2 text-sm">
                                        <Globe className="h-4 w-4 text-text-tertiary" />
                                        <a
                                            href={`https://${stock.issuer_data.website}?ref=talir`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-brand-500 hover:text-brand-600 hover:underline transition-colors flex items-center gap-1"
                                        >
                                            {stock.issuer_data.website}
                                            <ExternalLink className="h-3 w-3" />
                                        </a>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    )
}
