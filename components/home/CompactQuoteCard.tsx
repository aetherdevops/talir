import { PreviewMarketCard } from '@/components/home/PreviewMarketCard'
import { cn } from '@/lib/utils'

interface CompactQuoteCardProps {
    href: string
    label: string
    subtitle?: string
    chartSeries: { date: string; value: number }[]
    latestPrice: number
    changePercent: number
    valueKind: 'index' | 'stock'
    className?: string
}

export function CompactQuoteCard({
    className,
    ...props
}: CompactQuoteCardProps) {
    return (
        <PreviewMarketCard
            {...props}
            className={cn('w-[180px] shrink-0 snap-start', className)}
        />
    )
}
