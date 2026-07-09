
"use client"

import { useState, useMemo } from 'react'
import { IndexDetails, NewsItem } from '@/lib/data'
import { PriceChart } from '@/components/charts/PriceChart'
import { formatIndexLevel } from '@/lib/utils'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { StockPageActions } from '@/components/stock/StockPageActions'
import { NewsPreview } from '@/components/home/NewsPreview'
import { useLocale } from '@/components/providers/LocaleProvider'

interface IndexClientProps {
    index: IndexDetails
    news: NewsItem[]
}

type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

function getIndexDescription(code: string, name: string, t: (key: string) => string): string {
    if (code === 'MBI10' || name === 'MBI10') return t('index.mbi10Description')
    if (code === 'OMB' || name === 'OMB') return t('index.ombDescription')
    return t('index.noDescription')
}

export function IndexClient({ index, news }: IndexClientProps) {
    const { t } = useLocale()
    const [timeframe, setTimeframe] = useState<Timeframe>('1Y')

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

    const freshnessDate = new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    const indexDescription = getIndexDescription(index.code, index.name, t)

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary mb-1">{index.code}</h1>
                    <div className="flex items-center gap-3">
                        <span className="text-4xl font-bold text-text-primary tracking-tight">
                            {formatIndexLevel(index.currentValue)}
                        </span>
                        <ChangeLabel change={index.changePercent} variant="pill" className="text-sm" />
                    </div>
                    <div className="text-sm text-text-tertiary mt-2">
                        {freshnessDate}{t('index.mseDisclaimer')}
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
                        <h3 className="text-lg font-semibold mb-4 text-text-primary">{t('index.keyStatistics')}</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-sm text-text-secondary">{t('index.previousClose')}</span>
                                <span className="font-medium text-text-primary">
                                    {formatIndexLevel(index.currentValue - index.change)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-sm text-text-secondary">{t('index.dayRange')}</span>
                                <span className="font-medium text-text-primary">
                                    {index.dayRange ? `${formatIndexLevel(index.dayRange.min)} - ${formatIndexLevel(index.dayRange.max)}` : t('index.notAvailable')}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-border/50">
                                <span className="text-sm text-text-secondary">{t('index.yearRange')}</span>
                                <span className="font-medium text-text-primary">
                                    {index.yearRange ? `${formatIndexLevel(index.yearRange.min)} - ${formatIndexLevel(index.yearRange.max)}` : t('index.notAvailable')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* About Card */}
                    <div className="bg-surface border border-border rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold text-text-primary">{t('index.about')}</h3>
                        </div>
                        <p className="text-sm text-text-secondary leading-relaxed">
                            {indexDescription}
                        </p>
                        <div className="mt-4 pt-4 border-t border-border/50">
                            <span className="text-xs text-brand-500 font-medium cursor-pointer hover:underline">{t('index.wikipedia')}</span>
                        </div>
                    </div>

                </div>
            </div>

            {/* Bottom: News */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
                <h2 className="text-xl font-semibold mb-6 text-text-primary">{t('filings.updates')}</h2>
                <NewsPreview news={news} />
            </div>
        </div>
    )
}
