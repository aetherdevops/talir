import Link from 'next/link'
import { IndexSparkline } from '@/components/home/IndexSparkline'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { formatIndexLevelCompact, formatPriceCompact, cn, sparklineWindowChangePercent } from '@/lib/utils'

const SPARKLINE_HEIGHT = 40

interface PreviewMarketCardProps {
    href: string
    label: string
    subtitle?: string
    chartSeries: { date: string; value: number }[]
    latestPrice: number
    changePercent: number
    valueKind?: 'index' | 'stock'
    className?: string
}

export function PreviewMarketCard({
    href,
    label,
    subtitle,
    chartSeries,
    latestPrice,
    changePercent,
    valueKind = 'stock',
    className,
}: PreviewMarketCardProps) {
    const series = chartSeries.slice(-30)
    const windowChange = sparklineWindowChangePercent(series)
    const formattedValue =
        valueKind === 'index' ? formatIndexLevelCompact(latestPrice) : formatPriceCompact(latestPrice)

    return (
        <Link
            href={href}
            className={cn(
                'block w-full min-w-0 rounded-xl border border-border/60 bg-surface hover:border-border-active transition-colors',
                'p-2.5 flex flex-col gap-1.5 min-h-[44px]',
                className
            )}
        >
            <div className="min-w-0">
                <span className="font-data font-semibold text-text-primary text-xs block truncate">
                    {label}
                </span>
                {subtitle ? (
                    <span className="text-[10px] text-text-tertiary block truncate leading-tight">
                        {subtitle}
                    </span>
                ) : null}
            </div>

            <div
                className="w-full shrink-0"
                style={{ height: SPARKLINE_HEIGHT }}
            >
                <IndexSparkline
                    series={series}
                    changePercent={windowChange}
                    height={SPARKLINE_HEIGHT}
                    className="w-full h-full"
                />
            </div>

            <div className="flex items-baseline justify-between gap-1 min-w-0">
                <span className="text-sm font-semibold text-text-primary font-data truncate tabular-nums">
                    {formattedValue}
                </span>
                <ChangeLabel change={changePercent} className="text-[11px] shrink-0" />
            </div>
        </Link>
    )
}
