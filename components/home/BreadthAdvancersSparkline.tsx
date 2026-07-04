'use client'

import { useMemo } from 'react'
import type { BreadthHistoryPoint } from '@/lib/data'
import { cn, classifyChangePercent } from '@/lib/utils'

const SPARKLINE_HEIGHT = 40

interface BreadthAdvancersSparklineProps {
    history: BreadthHistoryPoint[]
    className?: string
}

export function BreadthAdvancersSparkline({ history, className }: BreadthAdvancersSparklineProps) {
    const series = history.slice(-5)

    const { path, changePercent } = useMemo(() => {
        if (series.length < 2) return { path: '', changePercent: 0 }

        const values = series.map((point) => point.advancers)
        const first = values[0]
        const last = values[values.length - 1]
        const changePercent = first > 0 ? ((last - first) / first) * 100 : last > first ? 100 : last < first ? -100 : 0

        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min || 1
        const w = 120
        const h = SPARKLINE_HEIGHT - 8

        const points = values.map((value, index) => {
            const x = series.length === 1 ? w / 2 : (index / (values.length - 1)) * w
            const y = h - ((value - min) / range) * h + 4
            return `${x},${y}`
        })

        return { path: `M ${points.join(' L ')}`, changePercent }
    }, [series])

    const stroke =
        classifyChangePercent(changePercent) === 'up'
            ? 'var(--up)'
            : classifyChangePercent(changePercent) === 'down'
              ? 'var(--down)'
              : 'var(--neutral)'

    if (series.length < 2) {
        return (
            <div
                className={cn('rounded bg-surface-tertiary/40', className)}
                style={{ width: 120, height: SPARKLINE_HEIGHT }}
                aria-hidden
            />
        )
    }

    return (
        <svg
            width={120}
            height={SPARKLINE_HEIGHT}
            viewBox={`0 0 120 ${SPARKLINE_HEIGHT}`}
            className={cn('shrink-0', className)}
            aria-hidden
        >
            <path
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={1.5}
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    )
}
