'use client'

import { useId, useMemo } from 'react'
import { cn, classifyChangePercent } from '@/lib/utils'

interface IndexSparklineProps {
    series: { date: string; value: number }[]
    changePercent: number
    className?: string
    height?: number
}

function strokeForChange(changePercent: number): string {
    const direction = classifyChangePercent(changePercent)
    if (direction === 'up') return 'var(--up)'
    if (direction === 'down') return 'var(--down)'
    return 'var(--neutral)'
}

export function IndexSparkline({ series, changePercent, className, height = 120 }: IndexSparklineProps) {
    const uid = useId().replace(/:/g, '')
    const path = useMemo(() => {
        if (!series.length) return ''
        const values = series.map((p) => p.value)
        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min || 1
        const w = 280
        const h = height - 8

        const points = series.map((p, i) => {
            const x = (i / Math.max(series.length - 1, 1)) * w
            const y = h - ((p.value - min) / range) * h + 4
            return `${x},${y}`
        })

        return `M ${points.join(' L ')}`
    }, [series, height])

    const areaPath = useMemo(() => {
        if (!path) return ''
        return `${path} L 280,${height} L 0,${height} Z`
    }, [path, height])

    if (!series.length) {
        return (
            <div
                className={cn('bg-surface-secondary/60 rounded', className)}
                style={{ height, width: height < 40 ? 72 : undefined }}
                aria-hidden
            />
        )
    }

    const stroke = strokeForChange(changePercent)
    const gradId = `grad-${uid}`

    return (
        <svg
            viewBox={`0 0 280 ${height}`}
            className={cn('w-full', className)}
            style={{ height }}
            preserveAspectRatio="none"
            aria-hidden
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={height < 40 ? 0.15 : 0.2} />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#${gradId})`} />
            <path
                d={path}
                fill="none"
                stroke={stroke}
                strokeWidth={height < 40 ? 1.5 : 2}
                vectorEffect="non-scaling-stroke"
            />
        </svg>
    )
}
