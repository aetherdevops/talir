'use client'

import { useMemo, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { MacroFocusChart } from '@/components/macro/MacroFocusChart'
import { MacroIndicatorGrid } from '@/components/macro/MacroIndicatorGrid'
import { MacroIndustryGrid } from '@/components/macro/MacroIndustryGrid'
import { MacroKpiStrip } from '@/components/macro/MacroKpiStrip'
import { MacroMarketSectors } from '@/components/macro/MacroMarketSectors'
import { MacroNewsList } from '@/components/macro/MacroNewsList'
import type { DerivedSectorRollup } from '@/lib/market-derived-types'
import {
    findSeries,
    getHeadlineSeries,
    getIndustrySeries,
    getKpiSeries,
    type MacroChartRange,
    type MacroFile,
} from '@/lib/macro'
import { formatAsOfDate } from '@/lib/utils'

interface MacroPageClientProps {
    data: MacroFile
    sectors: DerivedSectorRollup[]
}

export function MacroPageClient({ data, sectors }: MacroPageClientProps) {
    const { t, locale } = useLocale()
    const kpiSeries = useMemo(() => getKpiSeries(data), [data])
    const headlineSeries = useMemo(() => getHeadlineSeries(data), [data])
    const industrySeries = useMemo(() => getIndustrySeries(data), [data])
    const defaultId = kpiSeries[0]?.id ?? data.series[0]?.id ?? ''
    const [selectedId, setSelectedId] = useState(defaultId)
    const [range, setRange] = useState<MacroChartRange>('5Y')
    const [showYoy, setShowYoy] = useState(false)

    const selected = findSeries(data, selectedId) ?? data.series[0] ?? null
    const disclaimer = locale === 'mk' ? data.disclaimerMk : data.disclaimerEn
    const lastGathered = data.lastIngestedAt
        ? formatAsOfDate(data.lastIngestedAt.slice(0, 10))
        : null

    return (
        <div className="flex flex-col gap-8 min-w-0">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold font-heading text-text-primary tracking-tight">
                    {t('macro.title')}
                </h1>
                <p className="text-sm text-text-secondary">{t('macro.subtitle')}</p>
                <p className="text-xs font-data text-text-tertiary">
                    {t('macro.asOf', { date: formatAsOfDate(data.asOfDate) })}
                </p>
                {lastGathered ? (
                    <p className="text-xs font-data text-text-tertiary">
                        {t('macro.lastGathered', { date: lastGathered })}
                    </p>
                ) : null}
                <p className="text-[11px] text-text-tertiary max-w-2xl">{disclaimer}</p>
            </header>

            {kpiSeries.length > 0 ? (
                <MacroKpiStrip
                    series={kpiSeries}
                    selectedId={selected?.id ?? ''}
                    onSelect={setSelectedId}
                />
            ) : null}

            {selected ? (
                <MacroFocusChart
                    series={selected}
                    range={range}
                    onRangeChange={setRange}
                    showYoy={showYoy}
                    onShowYoyChange={setShowYoy}
                />
            ) : null}

            <MacroIndicatorGrid
                series={headlineSeries}
                selectedId={selected?.id ?? ''}
                onSelect={setSelectedId}
            />

            <MacroMarketSectors sectors={sectors} />

            <MacroIndustryGrid
                series={industrySeries}
                selectedId={selected?.id ?? ''}
                onSelect={setSelectedId}
            />

            <MacroNewsList news={data.news} />
        </div>
    )
}
