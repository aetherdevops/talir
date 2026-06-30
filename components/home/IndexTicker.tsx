import Link from 'next/link'
import { MarketIndex } from '@/lib/types'
import { formatPriceCompact } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/Card'
import { IndexSparkline } from '@/components/home/IndexSparkline'

interface IndexTickerProps {
    indices: MarketIndex[]
    children?: React.ReactNode
}

export function IndexTicker({ indices, children }: IndexTickerProps) {
    if ((!indices || indices.length === 0) && !children) return null

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3 min-w-max">
                {indices.map((idx) => {
                    const series = idx.chartSeries ?? []
                    const positive = idx.changePercent >= 0

                    return (
                        <Link href={`/market/${idx.name}`} key={idx.name} className="block min-w-[300px] max-w-[300px]">
                            <Card className="h-full border border-border hover:border-border-active transition-colors">
                                <CardContent className="p-4 space-y-3">
                                    <span className="font-semibold text-text-secondary text-xs tracking-wider uppercase">
                                        {idx.name}
                                    </span>
                                    <IndexSparkline series={series} positive={positive} height={120} />
                                    <p className="text-xl font-semibold text-text-primary tabular-nums">
                                        {formatPriceCompact(idx.value)}
                                    </p>
                                </CardContent>
                            </Card>
                        </Link>
                    )
                })}
                {children}
            </div>
        </div>
    )
}
