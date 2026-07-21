'use client'

import { useMemo } from 'react'
import {
    Area,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
    formatMacroValue,
    sliceByRange,
    yoySeries,
    type MacroChartRange,
    type MacroSeries,
} from '@/lib/macro'
import { cn, formatNewsDate } from '@/lib/utils'

const CHART_HEIGHT = 280
const RANGES: MacroChartRange[] = ['1Y', '5Y', '10Y', 'max']

interface MacroFocusChartProps {
    series: MacroSeries
    range: MacroChartRange
    onRangeChange: (range: MacroChartRange) => void
    showYoy: boolean
    onShowYoyChange: (next: boolean) => void
}

export function MacroFocusChart({
    series,
    range,
    onRangeChange,
    showYoy,
    onShowYoyChange,
}: MacroFocusChartProps) {
    const { t, locale } = useLocale()
    const label = locale === 'mk' ? series.labelMk : series.labelEn

    const sliced = useMemo(() => sliceByRange(series.points, range), [series.points, range])
    const yoy = useMemo(() => yoySeries(series.points), [series.points])

    const data = useMemo(() => {
        const yoyByDate = new Map(yoy.map((p) => [p.date, p.value]))
        return sliced.map((p) => ({
            date: p.date,
            value: p.value,
            yoy: yoyByDate.get(p.date) ?? null,
        }))
    }, [sliced, yoy])

    const canYoy = yoy.length > 0

    return (
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4 min-w-0">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="min-w-0 space-y-1">
                    <h2 className="text-lg font-heading font-semibold text-text-primary tracking-tight">
                        {label}
                    </h2>
                    <p className="text-[11px] font-data text-text-tertiary">
                        {[series.sourceAgency, series.sourceLabel, t(`macro.frequency.${series.frequency}`)]
                            .filter(Boolean)
                            .join(' · ')}
                        {series.sourceUrl ? (
                            <>
                                {' · '}
                                <a
                                    href={series.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="hover:text-accent underline-offset-2 hover:underline"
                                >
                                    {t('macro.sourceLink')}
                                </a>
                            </>
                        ) : null}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <div
                        className="inline-flex rounded-lg border border-border bg-surface-secondary p-0.5"
                        role="group"
                        aria-label={t('macro.rangeLabel')}
                    >
                        {RANGES.map((r) => (
                            <button
                                key={r}
                                type="button"
                                onClick={() => onRangeChange(r)}
                                className={cn(
                                    'px-2.5 py-1 text-[11px] font-data rounded-md transition-colors',
                                    range === r
                                        ? 'bg-surface text-text-primary border border-border'
                                        : 'text-text-secondary hover:text-text-primary'
                                )}
                                aria-pressed={range === r}
                            >
                                {t(`macro.range.${r}`)}
                            </button>
                        ))}
                    </div>
                    {canYoy ? (
                        <label className="inline-flex items-center gap-2 text-xs font-sans text-text-secondary cursor-pointer select-none">
                            <input
                                type="checkbox"
                                checked={showYoy}
                                onChange={(e) => onShowYoyChange(e.target.checked)}
                                className="rounded border-border accent-[var(--accent)]"
                            />
                            {t('macro.showYoy')}
                        </label>
                    ) : null}
                </div>
            </div>

            <div style={{ height: CHART_HEIGHT, width: '100%' }} className="min-w-0 w-full">
                {data.length < 2 ? (
                    <div className="h-full flex items-center justify-center text-sm text-text-tertiary">
                        {t('macro.chartEmpty')}
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                            <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
                            <XAxis
                                dataKey="date"
                                tickFormatter={(d: string) => {
                                    const y = d.slice(0, 4)
                                    return range === '1Y' ? formatNewsDate(d).slice(0, 5) : y
                                }}
                                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={28}
                            />
                            <YAxis
                                yAxisId="level"
                                tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                axisLine={false}
                                tickLine={false}
                                width={48}
                                tickFormatter={(v: number) => formatMacroValue(v, series.unit, 1)}
                            />
                            {showYoy && canYoy ? (
                                <YAxis
                                    yAxisId="yoy"
                                    orientation="right"
                                    tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                                    axisLine={false}
                                    tickLine={false}
                                    width={40}
                                    tickFormatter={(v: number) => `${v.toFixed(1)}`}
                                />
                            ) : null}
                            <Tooltip
                                formatter={(value: number, name: string) => {
                                    if (name === 'yoy') {
                                        const sign = value > 0 ? '+' : value < 0 ? '−' : ''
                                        return [
                                            `${sign}${Math.abs(value).toFixed(1)} pp`,
                                            t('macro.yoyOverlay'),
                                        ]
                                    }
                                    return [formatMacroValue(value, series.unit), label]
                                }}
                                labelFormatter={(d: string) => formatNewsDate(d)}
                                contentStyle={{
                                    background: 'var(--surface)',
                                    border: '1px solid var(--border)',
                                    borderRadius: 8,
                                    fontSize: 12,
                                }}
                            />
                            <Area
                                yAxisId="level"
                                type="monotone"
                                dataKey="value"
                                stroke="var(--accent)"
                                fill="var(--accent)"
                                fillOpacity={0.12}
                                strokeWidth={2}
                                isAnimationActive={false}
                            />
                            {showYoy && canYoy ? (
                                <Line
                                    yAxisId="yoy"
                                    type="monotone"
                                    dataKey="yoy"
                                    stroke="var(--text-muted)"
                                    strokeWidth={1.5}
                                    strokeDasharray="4 3"
                                    dot={false}
                                    connectNulls
                                    isAnimationActive={false}
                                />
                            ) : null}
                        </ComposedChart>
                    </ResponsiveContainer>
                )}
            </div>
        </section>
    )
}
