'use client'

import { ArrowDown, ArrowUp } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
    formatMacroDelta,
    priorBaselineLabel,
    type MacroDelta,
    type MacroFrequency,
    type MacroSeries,
} from '@/lib/macro'
import { cn } from '@/lib/utils'

interface MacroDeltaLabelProps {
    delta: MacroDelta
    frequency: MacroFrequency
    deltaUnit: MacroSeries['deltaUnit']
    className?: string
    /** Show baseline caption under / beside the value (always preferred). */
    showBaseline?: boolean
    size?: 'sm' | 'md'
}

export function MacroDeltaLabel({
    delta,
    frequency,
    deltaUnit,
    className,
    showBaseline = true,
    size = 'sm',
}: MacroDeltaLabelProps) {
    const { t } = useLocale()
    const text = formatMacroDelta(delta, deltaUnit)
    const baselineKey = priorBaselineLabel(frequency, delta.baseline)
    const baseline = t(`macro.${baselineKey}`)

    const color =
        delta.kind === 'up' ? 'text-up' : delta.kind === 'down' ? 'text-down' : 'text-neutral'
    const Icon = delta.kind === 'up' ? ArrowUp : delta.kind === 'down' ? ArrowDown : null
    const valueSize = size === 'md' ? 'text-sm' : 'text-xs'

    return (
        <span className={cn('inline-flex flex-col gap-0.5 min-w-0', className)}>
            <span
                className={cn(
                    'inline-flex items-center gap-0.5 font-data font-semibold tabular-nums',
                    valueSize,
                    color
                )}
            >
                {Icon ? <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden /> : null}
                <span>{text}</span>
            </span>
            {showBaseline ? (
                <span className="text-[10px] font-sans text-text-tertiary leading-tight">
                    {baseline}
                </span>
            ) : null}
        </span>
    )
}
