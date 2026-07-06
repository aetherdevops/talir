'use client'

import { useId, useMemo } from 'react'
import type { YieldAtExPoint } from '@/lib/dividend-scorecard'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

interface DividendYieldSparklineProps {
    series: YieldAtExPoint[]
    className?: string
    height?: number
}

export function DividendYieldSparkline({ series, className, height = 48 }: DividendYieldSparklineProps) {
    const { t } = useLocale()
    const uid = useId().replace(/:/g, '')

    const { path, areaPath, trend } = useMemo(() => {
        if (series.length < 2) {
            return { path: '', areaPath: '', trend: 'flat' as const }
        }

        const values = series.map((point) => point.yieldPct)
        const min = Math.min(...values)
        const max = Math.max(...values)
        const range = max - min || 1
        const w = 240
        const h = height - 6

        const points = series.map((point, index) => {
            const x = (index / Math.max(series.length - 1, 1)) * w
            const y = h - ((point.yieldPct - min) / range) * h + 3
            return { x, y }
        })

        const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')
        const area = `${line} L ${w} ${h + 3} L 0 ${h + 3} Z`

        const first = values[0]!
        const last = values[values.length - 1]!
        const trend = last > first + 0.05 ? 'up' : last < first - 0.05 ? 'down' : 'flat'

        return { path: line, areaPath: area, trend }
    }, [series, height])

    if (series.length < 2 || !path) return null

    const stroke =
        trend === 'up' ? 'var(--up)' : trend === 'down' ? 'var(--down)' : 'var(--neutral)'

    return (
        <div className={cn('min-w-0 space-y-1', className)}>
            <p className="text-[10px] font-data text-text-tertiary">{t('dividends.yieldSparklineCaption')}</p>
            <svg
                viewBox={`0 0 240 ${height}`}
                className="w-full max-w-full"
                style={{ height }}
                role="img"
                aria-label={t('results.yieldSparklineAria', { count: series.length })}
                preserveAspectRatio="none"
            >
                <defs>
                    <linearGradient id={`yield-fill-${uid}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={stroke} stopOpacity="0.2" />
                        <stop offset="100%" stopColor={stroke} stopOpacity="0" />
                    </linearGradient>
                </defs>
                <path d={areaPath} fill={`url(#yield-fill-${uid})`} />
                <path d={path} fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        </div>
    )
}
