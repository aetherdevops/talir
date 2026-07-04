import { StockSummary } from '@/lib/types'
import { PreviewMarketCard } from '@/components/home/PreviewMarketCard'

interface StockPreviewCardProps {
    stock: StockSummary
    className?: string
}

export function StockPreviewCard({ stock, className }: StockPreviewCardProps) {
    return (
        <PreviewMarketCard
            href={`/stock/${stock.code}`}
            label={stock.code}
            subtitle={stock.name}
            chartSeries={stock.chartSeries ?? []}
            latestPrice={stock.price}
            changePercent={stock.changePercent}
            className={className}
        />
    )
}
