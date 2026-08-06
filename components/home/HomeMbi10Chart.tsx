'use client'

import { useMemo, useState } from 'react'
import { ClientPriceChart } from '@/components/charts/ClientPriceChart'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { SectionCard } from '@/components/ui/SectionCard'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { IndexDetails } from '@/lib/data'
import { formatIndexLevel } from '@/lib/utils'

type Timeframe = '1D' | '5D' | '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'

const HOME_CHART_CLASS = 'h-[240px] sm:h-[280px] md:h-[360px]'

interface HomeMbi10ChartProps {
    index: IndexDetails
    asOfDate: string
}

export function HomeMbi10Chart({ index, asOfDate }: HomeMbi10ChartProps) {
    const { t } = useLocale()
    const [timeframe, setTimeframe] = useState<Timeframe>('1Y')

    const chartData = useMemo(() => {
        const fullHistory = index.history.map((h) => ({
            time: h.date,
            value: h.value,
        }))

        if (timeframe === 'MAX') return fullHistory

        const now = new Date()
        const cutoff = new Date()
        switch (timeframe) {
            case '1D':
                cutoff.setDate(now.getDate() - 1)
                break
            case '5D':
                cutoff.setDate(now.getDate() - 5)
                break
            case '1M':
                cutoff.setMonth(now.getMonth() - 1)
                break
            case '3M':
                cutoff.setMonth(now.getMonth() - 3)
                break
            case '6M':
                cutoff.setMonth(now.getMonth() - 6)
                break
            case 'YTD':
                cutoff.setMonth(0)
                cutoff.setDate(1)
                break
            case '1Y':
                cutoff.setFullYear(now.getFullYear() - 1)
                break
            case '5Y':
                cutoff.setFullYear(now.getFullYear() - 5)
                break
        }

        return fullHistory.filter((d) => new Date(d.time) >= cutoff)
    }, [index.history, timeframe])

    return (
        <SectionCard className="p-4 sm:p-5 space-y-3" aria-labelledby="home-mbi10-heading">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <h2
                            id="home-mbi10-heading"
                            className="text-lg font-heading font-semibold text-text-primary tracking-tight"
                        >
                            <LocaleLink
                                href="/market/MBI10"
                                className="hover:text-accent transition-colors"
                            >
                                {t('home.mbi10ChartTitle')}
                            </LocaleLink>
                        </h2>
                        <span className="font-data text-2xl font-semibold tabular-nums text-text-primary tracking-tight">
                            {formatIndexLevel(index.currentValue)}
                        </span>
                        <ChangeLabel change={index.changePercent} variant="pill" />
                    </div>
                    <DataFreshnessLabel asOfDate={asOfDate} variant="compact" />
                </div>
                <LocaleLink
                    href="/market/MBI10"
                    className="text-xs font-data text-text-tertiary hover:text-accent shrink-0"
                >
                    {t('home.mbi10ChartLink')}
                </LocaleLink>
            </div>

            <div className="w-full min-w-0 pb-1">
                <ClientPriceChart
                    data={chartData}
                    timeframe={timeframe}
                    onTimeframeChange={setTimeframe}
                    excludePeriods={['1D']}
                    chartClassName={HOME_CHART_CLASS}
                />
            </div>
        </SectionCard>
    )
}
