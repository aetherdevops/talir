import Link from 'next/link'
import { IndexSparkline } from '@/components/home/IndexSparkline'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { formatPriceCompact } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface PreviewMarketCardProps {
    href: string
    label: string
    chartSeries: { date: string; value: number }[]
    latestPrice: number
    changePercent: number
    className?: string
}

export function PreviewMarketCard({
    href,
    label,
    chartSeries,
    latestPrice,
    changePercent,
    className,
}: PreviewMarketCardProps) {
    const positive = changePercent >= 0

    return (
        <Link
            href={href}
            className={cn(
                'block shrink-0 aspect-square w-[calc(50vw-28px)] max-w-[168px] sm:w-[180px] sm:max-w-[180px] md:w-[196px] md:max-w-[196px]',
                'rounded-xl border border-border/60 bg-surface hover:border-border-active transition-colors',
                'p-3 flex flex-col justify-between',
                className
            )}
        >
            <span className="font-semibold text-text-secondary text-[10px] sm:text-xs tracking-wider uppercase truncate">
                {label}
            </span>
            <div className="flex-1 flex items-center min-h-[48px] my-1">
                <IndexSparkline
                    series={chartSeries}
                    positive={positive}
                    height={48}
                    className="w-full"
                />
            </div>
            <div className="space-y-0.5">
                <span className="text-base sm:text-lg font-semibold text-text-primary tabular-nums block">
                    {formatPriceCompact(latestPrice)}
                </span>
                <ChangeLabel change={changePercent} className="text-xs" />
            </div>
        </Link>
    )
}
