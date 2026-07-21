'use client'

import { useLocale } from '@/components/providers/LocaleProvider'
import { MacroDeltaLabel } from '@/components/macro/MacroDeltaLabel'
import { MacroSparkline } from '@/components/macro/MacroSparkline'
import {
    changeVsPrior,
    formatMacroValue,
    latestPoint,
    type MacroSeries,
} from '@/lib/macro'
import { cn } from '@/lib/utils'

const SPARK_POINTS = 24
const CARD_HEIGHT = 112

interface MacroKpiStripProps {
    series: MacroSeries[]
    selectedId: string
    onSelect: (id: string) => void
}

export function MacroKpiStrip({ series, selectedId, onSelect }: MacroKpiStripProps) {
    const { locale } = useLocale()

    return (
        <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 min-w-0"
            role="list"
            aria-label="Macro KPIs"
        >
            {series.map((s) => {
                const latest = latestPoint(s.points)
                const delta = changeVsPrior(s.points)
                const spark = s.points.slice(-SPARK_POINTS)
                const label = locale === 'mk' ? s.labelMk : s.labelEn
                const selected = s.id === selectedId

                return (
                    <button
                        key={s.id}
                        type="button"
                        role="listitem"
                        onClick={() => onSelect(s.id)}
                        className={cn(
                            'text-left rounded-xl border px-3 py-3 flex flex-col gap-2 min-w-0 transition-colors',
                            'bg-surface hover:bg-surface-secondary focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent',
                            selected ? 'border-accent' : 'border-border'
                        )}
                        style={{ minHeight: CARD_HEIGHT }}
                        aria-pressed={selected}
                    >
                        <span className="text-[11px] font-sans text-text-secondary leading-snug line-clamp-2">
                            {label}
                        </span>
                        <span className="font-data text-xl font-semibold tabular-nums text-text-primary tracking-tight">
                            {latest ? formatMacroValue(latest.value, s.unit) : '—'}
                        </span>
                        <div className="mt-auto flex items-end justify-between gap-2">
                            {delta ? (
                                <MacroDeltaLabel
                                    delta={delta}
                                    frequency={s.frequency}
                                    deltaUnit={s.deltaUnit}
                                />
                            ) : (
                                <span className="text-[10px] text-text-tertiary">—</span>
                            )}
                            <MacroSparkline
                                points={spark}
                                kind={delta?.kind ?? 'neutral'}
                                width={64}
                                height={28}
                            />
                        </div>
                    </button>
                )
            })}
        </div>
    )
}
