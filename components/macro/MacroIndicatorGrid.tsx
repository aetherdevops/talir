'use client'

import { useLocale } from '@/components/providers/LocaleProvider'
import { MacroDeltaLabel } from '@/components/macro/MacroDeltaLabel'
import { MacroSparkline } from '@/components/macro/MacroSparkline'
import {
    changeVsPrior,
    changeVsYearAgo,
    formatMacroValue,
    latestPoint,
    priorPoint,
    type MacroSeries,
} from '@/lib/macro'
import { cn } from '@/lib/utils'

const SPARK_POINTS = 18

interface MacroIndicatorGridProps {
    series: MacroSeries[]
    selectedId: string
    onSelect: (id: string) => void
}

export function MacroIndicatorGrid({ series, selectedId, onSelect }: MacroIndicatorGridProps) {
    const { t, locale } = useLocale()

    return (
        <section className="space-y-3 min-w-0" aria-labelledby="macro-indicators">
            <div className="space-y-1">
                <h2
                    id="macro-indicators"
                    className="text-lg font-heading font-semibold text-text-primary tracking-tight"
                >
                    {t('macro.indicators')}
                </h2>
                <p className="text-sm text-text-secondary">{t('macro.indicatorsSubtitle')}</p>
            </div>

            <div className="rounded-xl border border-border bg-surface overflow-x-auto min-w-0">
                <table className="w-full min-w-[640px] text-left border-collapse">
                    <thead>
                        <tr className="border-b border-border">
                            <th className="px-3 py-2.5 text-[10px] font-data uppercase tracking-wide text-text-tertiary font-medium">
                                {t('macro.col.indicator')}
                            </th>
                            <th className="px-3 py-2.5 text-[10px] font-data uppercase tracking-wide text-text-tertiary font-medium text-right">
                                {t('macro.col.latest')}
                            </th>
                            <th className="px-3 py-2.5 text-[10px] font-data uppercase tracking-wide text-text-tertiary font-medium text-right">
                                {t('macro.col.prior')}
                            </th>
                            <th className="px-3 py-2.5 text-[10px] font-data uppercase tracking-wide text-text-tertiary font-medium">
                                {t('macro.col.delta')}
                            </th>
                            <th className="px-3 py-2.5 text-[10px] font-data uppercase tracking-wide text-text-tertiary font-medium">
                                {t('macro.col.yoy')}
                            </th>
                            <th className="px-3 py-2.5 text-[10px] font-data uppercase tracking-wide text-text-tertiary font-medium w-[80px]">
                                {t('macro.col.trend')}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {series.map((s) => {
                            const latest = latestPoint(s.points)
                            const prior = priorPoint(s.points)
                            const delta = changeVsPrior(s.points)
                            const yoy = changeVsYearAgo(s.points)
                            const label = locale === 'mk' ? s.labelMk : s.labelEn
                            const selected = s.id === selectedId
                            const spark = s.points.slice(-SPARK_POINTS)

                            return (
                                <tr
                                    key={s.id}
                                    onClick={() => onSelect(s.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault()
                                            onSelect(s.id)
                                        }
                                    }}
                                    tabIndex={0}
                                    aria-selected={selected}
                                    className={cn(
                                        'border-b border-border last:border-b-0 cursor-pointer transition-colors',
                                        selected ? 'bg-accent/10' : 'hover:bg-surface-secondary/80'
                                    )}
                                >
                                    <td className="px-3 py-3">
                                        <span className="text-sm font-sans text-text-primary">{label}</span>
                                        <span className="block text-[10px] font-data text-text-tertiary mt-0.5">
                                            {t(`macro.frequency.${s.frequency}`)}
                                        </span>
                                    </td>
                                    <td className="px-3 py-3 text-right font-data text-sm tabular-nums text-text-primary font-semibold">
                                        {latest ? formatMacroValue(latest.value, s.unit) : '—'}
                                    </td>
                                    <td className="px-3 py-3 text-right font-data text-sm tabular-nums text-text-secondary">
                                        {prior ? formatMacroValue(prior.value, s.unit) : '—'}
                                    </td>
                                    <td className="px-3 py-3">
                                        {delta ? (
                                            <MacroDeltaLabel
                                                delta={delta}
                                                frequency={s.frequency}
                                                deltaUnit={s.deltaUnit}
                                            />
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        {yoy ? (
                                            <MacroDeltaLabel
                                                delta={yoy}
                                                frequency={s.frequency}
                                                deltaUnit={s.deltaUnit}
                                            />
                                        ) : (
                                            '—'
                                        )}
                                    </td>
                                    <td className="px-3 py-3">
                                        <MacroSparkline
                                            points={spark}
                                            kind={delta?.kind ?? 'neutral'}
                                            width={72}
                                            height={28}
                                        />
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>
        </section>
    )
}
