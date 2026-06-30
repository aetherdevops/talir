'use client'

import { useMemo } from 'react'
import { cn } from '@/lib/utils'

interface IndexSparklineProps {
    series: { date: string; value: number }[]
    positive?: boolean
    className?: string
    height?: number
}

export function IndexSparkline({ series, positive = true, className, height = 120 }: IndexSparklineProps) {
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
        return <div className={cn('bg-surface-secondary rounded-lg animate-pulse', className)} style={{ height }} />
    }

    const stroke = positive ? 'var(--up)' : 'var(--down)'

    return (
        <svg
            viewBox={`0 0 280 ${height}`}
            className={cn('w-full', className)}
            style={{ height }}
            preserveAspectRatio="none"
            aria-hidden
        >
            <defs>
                <linearGradient id={`grad-${positive ? 'up' : 'down'}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                </linearGradient>
            </defs>
            <path d={areaPath} fill={`url(#grad-${positive ? 'up' : 'down'})`} />
            <path d={path} fill="none" stroke={stroke} strokeWidth="2" vectorEffect="non-scaling-stroke" />
        </svg>
    )
}
