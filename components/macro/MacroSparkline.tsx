'use client'

import { useId, useMemo } from 'react'
import type { ChangeDirection } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { MacroPoint } from '@/lib/macro'

interface MacroSparklineProps {
    points: MacroPoint[]
    kind: ChangeDirection
    className?: string
    width?: number
    height?: number
}

function strokeForKind(kind: ChangeDirection): string {
    if (kind === 'up') return 'var(--up)'
    if (kind === 'down') return 'var(--down)'
    return 'var(--neutral)'
}

export function MacroSparkline({
    points,
    kind,
    className,
    width = 72,
    height = 28,
}: MacroSparklineProps) {
    const uid = useId().replace(/:/g, '')
    const path = useMemo(() => {
        if (points.length < 2) return ''
        const values = points.map((p) => p.value)
        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min || 1
        const pad = 2
        const h = height - pad * 2
        const coords = points.map((p, i) => {
            const x = (i / Math.max(points.length - 1, 1)) * width
            const y = pad + h - ((p.value - min) / range) * h
            return `${x},${y}`
        })
        return `M ${coords.join(' L ')}`
    }, [points, width, height])

    if (points.length < 2) {
        return (
            <div
                className={cn('rounded bg-surface-secondary/60', className)}
                style={{ width, height }}
                aria-hidden
            />
        )
    }

    const stroke = strokeForKind(kind)
    const gradId = `macro-spark-${uid}`

    return (
        <svg
            width={width}
            height={height}
            viewBox={`0 0 ${width} ${height}`}
            className={cn('overflow-visible', className)}
            aria-hidden
        >
            <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={stroke} stopOpacity={0.22} />
                    <stop offset="100%" stopColor={stroke} stopOpacity={0} />
                </linearGradient>
            </defs>
            <path
                d={`${path} L ${width},${height} L 0,${height} Z`}
                fill={`url(#${gradId})`}
            />
            <path d={path} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinecap="round" />
        </svg>
    )
}
