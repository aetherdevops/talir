"use client"

import { useState, useMemo } from 'react'
import { ArrowLeft } from 'lucide-react'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ClientPriceChart } from '@/components/charts/ClientPriceChart'
import { formatDecimal } from '@/lib/utils'
import { StockPageActions } from '@/components/stock/StockPageActions'
import { StickyStockHeader } from '@/components/stock/StickyStockHeader'
import { usePreferencesStore, type ChartRange } from '@/lib/stores/preferences'
import { PortfolioHoldingIndicator } from '@/components/portfolio/PortfolioHoldingIndicator'
import { StockDividendsSidebarCard } from '@/components/dividends/StockDividendsSidebarCard'
import { StockFilingsSection } from '@/components/stock/StockFilingsSection'
import { DailyPrice, NewsItem, StockData, StockSummary } from '@/lib/types'
import type { DividendCalendarEntry } from '@/lib/dividends'
import type { FundamentalEntry } from '@/lib/fundamentals'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { buildStockValuationSnapshot } from '@/lib/stock-valuation'
import { computeAvgVolume, computePrevClose, computeYearRange } from '@/lib/stock-stats'
import { StockPageHero } from '@/components/stock/StockPageHero'
import { StockKeyStatisticsGrid } from '@/components/stock/StockKeyStatisticsGrid'
import { StockPageTabList, useStockPageTab } from '@/components/stock/StockPageTabs'
import { StockRelatedRow } from '@/components/stock/StockRelatedRow'
import { StockProfileCard } from '@/components/stock/StockProfileCard'
import { StockFinancialsTab } from '@/components/stock/StockFinancialsTab'
import { StockDividendOverviewTeaser } from '@/components/stock/StockDividendOverviewTeaser'
import { NewsCard } from '@/components/news/NewsCard'

interface ChartData {
    time: string
    value: number
    volume?: number
}

interface StockClientProps {
    stock: StockData
    history: DailyPrice[]
    currentPrice: number
    chartData: ChartData[]
    filingsDated: NewsItem[]
    filingsUndated: NewsItem[]
    issuerResults: ResultsCalendarEntry[]
    issuerExpected: ExpectedResultsEntry[]
    issuerDividends: DividendCalendarEntry[]
    issuerFundamentals: FundamentalEntry[]
    relatedStocks: StockSummary[]
    asOfDate: string
}

type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

function chartRangeToTimeframe(range: ChartRange): Timeframe {
    return range as Timeframe
}

export function StockClient({
    stock,
    history,
    currentPrice,
    chartData,
    filingsDated,
    filingsUndated,
    issuerResults,
    issuerExpected,
    issuerDividends,
    issuerFundamentals,
    relatedStocks,
    asOfDate,
}: StockClientProps) {
    const { t } = useLocale()
    const defaultChartRange = usePreferencesStore((s) => s.defaultChartRange)
    const [timeframe, setTimeframe] = useState<Timeframe>(() => chartRangeToTimeframe(defaultChartRange))
    const [activeTab, setActiveTab] = useStockPageTab()

    const valuationSnapshot = useMemo(
        () =>
            buildStockValuationSnapshot({
                price: currentPrice,
                fundamentals: issuerFundamentals,
                dividends: issuerDividends,
            }),
        [currentPrice, issuerFundamentals, issuerDividends]
    )

    const filteredData = useMemo(() => {
        if (!chartData.length) return []
        const now = new Date()

        switch (timeframe) {
            case '1D':
                return chartData.slice(-2)
            case '5D':
                return chartData.slice(-5)
            case '1M':
                return chartData.slice(-22)
            case '3M':
                return chartData.slice(-66)
            case '6M':
                return chartData.slice(-132)
            case 'YTD': {
                const startOfYear = new Date(now.getFullYear(), 0, 1)
                return chartData.filter((d) => new Date(d.time) >= startOfYear)
            }
            case '1Y': {
                const oneYearAgo = new Date()
                oneYearAgo.setFullYear(now.getFullYear() - 1)
                return chartData.filter((d) => new Date(d.time) >= oneYearAgo)
            }
            case '5Y': {
                const fiveYearsAgo = new Date()
                fiveYearsAgo.setFullYear(now.getFullYear() - 5)
                return chartData.filter((d) => new Date(d.time) >= fiveYearsAgo)
            }
            case 'MAX':
                return chartData
            default:
                return chartData
        }
    }, [chartData, timeframe])

    const displayStats = useMemo(() => {
        const latestHistory = history[history.length - 1] || {}
        let change = latestHistory.percent_change || 0
        let absChange = (currentPrice * change) / 100
        let label = t('stock.changeToday')

        if (timeframe !== '1D' && filteredData.length > 0) {
            const first = filteredData[0]
            const latestVal = currentPrice
            const startVal = first.value

            if (startVal !== 0) {
                absChange = latestVal - startVal
                change = (absChange / startVal) * 100
            }

            if (timeframe === 'YTD') label = t('stock.changeYtd')
            else if (timeframe === 'MAX') label = t('stock.changeAllTime')
            else label = timeframe
        } else if (timeframe === '1D') {
            const latest = history[history.length - 1] || {}
            change = latest.percent_change || 0
            absChange = (currentPrice * change) / 100
        }

        return { change, absChange, label }
    }, [timeframe, filteredData, currentPrice, history, t])

    const latest = history[history.length - 1] || {}
    const prevClose = computePrevClose(history)
    const avgVolume = computeAvgVolume(history, 20)
    const { low: yearLow, high: yearHigh } = useMemo(() => computeYearRange(chartData), [chartData])

    const stockSummary: StockSummary = useMemo(
        () => ({
            code: stock.company_code,
            name: stock.company_name,
            price: currentPrice,
            change: displayStats.absChange,
            changePercent: displayStats.change,
            volume: latest.quantity || 0,
            turnover: latest.total_turnover_mkd || 0,
            date: asOfDate,
            type: 'Stock',
        }),
        [stock, currentPrice, displayStats, latest, asOfDate]
    )

    const recentFilings = useMemo(
        () =>
            [...filingsDated]
                .sort((a, b) => (b.publishedAt ?? '').localeCompare(a.publishedAt ?? ''))
                .slice(0, 6),
        [filingsDated]
    )

    const eodStats = {
        dayLow: latest.min_price,
        dayHigh: latest.max_price,
        prevClose,
        volume: latest.quantity ?? null,
        avgVolume,
        turnover: latest.total_turnover_mkd ?? null,
        avgPrice: latest.average_price > 0 ? latest.average_price : null,
        yearLow: yearLow && yearLow > 0 ? yearLow : null,
        yearHigh: yearHigh && yearHigh > 0 ? yearHigh : null,
        firstTradeDate: stock.first_trade_date || null,
    }

    return (
        <div className="flex flex-col gap-6 animate-fade-in w-full max-w-[1200px] mx-auto min-w-0">
            <LocaleLink
                href="/"
                className="flex items-center gap-2 text-sm text-text-secondary hover:text-text-primary transition-colors w-fit"
            >
                <ArrowLeft className="h-4 w-4" />
                <span>{t('stock.backToOverview')}</span>
            </LocaleLink>

            <StockPageHero
                code={stock.company_code}
                name={stock.company_name}
                sector={stock.sector}
                price={currentPrice}
                changePercent={displayStats.change}
                absChange={displayStats.absChange}
                changeLabel={displayStats.label}
                asOfDate={asOfDate}
                stockData={stockSummary}
            />

            <StickyStockHeader
                code={stock.company_code}
                name={stock.company_name}
                price={currentPrice}
                changePercent={displayStats.change}
            />

            <section
                aria-label={t('stock.priceChartAria')}
                className="rounded-xl border border-border bg-surface p-3 md:p-4 min-h-[450px]"
            >
                <ClientPriceChart
                    data={filteredData}
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    prevClose={prevClose}
                />
            </section>

            <StockPageTabList activeTab={activeTab} onTabChange={setActiveTab} />

            <div role="tabpanel" className="space-y-6 min-w-0">
                {activeTab === 'overview' ? (
                    <>
                        <StockKeyStatisticsGrid
                            eod={eodStats}
                            snapshot={valuationSnapshot}
                            dividends={issuerDividends}
                        />

                        {issuerDividends.length > 0 ? (
                            <StockDividendOverviewTeaser
                                dividends={issuerDividends}
                                onViewDividends={() => setActiveTab('dividends')}
                            />
                        ) : null}

                        {stock.sector ? (
                            <StockRelatedRow stocks={relatedStocks} sector={stock.sector} />
                        ) : null}

                        {recentFilings.length > 0 ? (
                            <section aria-labelledby="recent-filings-heading" className="space-y-3">
                                <div className="flex items-center justify-between gap-2">
                                    <h2 id="recent-filings-heading" className="text-sm font-semibold text-text-primary">
                                        {t('stock.recentUpdates')}
                                    </h2>
                                    {filingsDated.length > 6 ? (
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab('updates')}
                                            className="text-xs text-accent hover:underline font-medium min-h-[44px] px-2"
                                        >
                                            {t('stock.showAll')}
                                        </button>
                                    ) : null}
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {recentFilings.map((item) => (
                                        <NewsCard key={item.id} item={item} />
                                    ))}
                                </div>
                            </section>
                        ) : null}

                        <StockProfileCard
                            companyCode={stock.company_code}
                            companyName={stock.company_name}
                            sector={stock.sector}
                            issuerData={stock.issuer_data}
                            asOfDate={asOfDate}
                        />
                    </>
                ) : null}

                {activeTab === 'updates' ? (
                    <StockFilingsSection
                        dated={filingsDated}
                        undated={filingsUndated}
                        results={issuerResults}
                        expected={issuerExpected}
                        dividends={issuerDividends}
                        onViewDividends={() => setActiveTab('dividends')}
                    />
                ) : null}

                {activeTab === 'dividends' ? (
                    issuerDividends.length > 0 ? (
                        <StockDividendsSidebarCard
                            stockCode={stock.company_code}
                            dividends={issuerDividends}
                            currentPrice={currentPrice}
                            firstTradeDate={eodStats.firstTradeDate}
                        />
                    ) : (
                        <p className="text-sm text-text-secondary py-4">
                            {t('stock.noDividends')}
                        </p>
                    )
                ) : null}

                {activeTab === 'financials' ? (
                    <StockFinancialsTab fundamentals={issuerFundamentals} asOfDate={asOfDate} />
                ) : null}

                {activeTab === 'portfolio' ? (
                    <div className="space-y-4">
                        <PortfolioHoldingIndicator
                            stockCode={stock.company_code}
                            currentPrice={currentPrice}
                        />
                        <div className="rounded-xl border border-border bg-surface p-4 md:p-5 space-y-3">
                            <h2 className="text-sm font-semibold text-text-primary">{t('stock.watchlistPortfolio')}</h2>
                            <p className="text-sm text-text-secondary">
                                {t('stock.watchlistPortfolioHint')}
                            </p>
                            <StockPageActions stockCode={stock.company_code} stockData={stockSummary} />
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
    )
}
