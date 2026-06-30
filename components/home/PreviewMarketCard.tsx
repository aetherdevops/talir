import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/Card'
import { IndexSparkline } from '@/components/home/IndexSparkline'
import { PeriodChangeLabel } from '@/components/home/PeriodChangeLabel'
import { formatPriceCompact, getPeriodChangePercent } from '@/lib/utils'

interface PreviewMarketCardProps {
    href: string
    label: string
    chartSeries: { date: string; value: number }[]
    latestPrice: number
}

export function PreviewMarketCard({ href, label, chartSeries, latestPrice }: PreviewMarketCardProps) {
    const periodChange = getPeriodChangePercent(chartSeries)
    const positive = periodChange >= 0

    return (
        <Link href={href} className="block min-w-[300px] max-w-[300px]">
            <Card className="h-full border border-border hover:border-border-active transition-colors">
                <CardContent className="p-4 space-y-3">
                    <span className="font-semibold text-text-secondary text-xs tracking-wider uppercase">
                        {label}
                    </span>
                    <IndexSparkline series={chartSeries} positive={positive} height={120} />
                    <div className="flex items-baseline gap-2 flex-wrap">
                        <span className="text-xl font-semibold text-text-primary tabular-nums">
                            {formatPriceCompact(latestPrice)}
                        </span>
                        {chartSeries.length > 1 && <PeriodChangeLabel change={periodChange} />}
                    </div>
                </CardContent>
            </Card>
        </Link>
    )
}
