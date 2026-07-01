import { StockSummary } from '@/lib/types'
import { PreviewMarketCard } from '@/components/home/PreviewMarketCard'

interface StockPreviewCardProps {
    stock: StockSummary
}

export function StockPreviewCard({ stock }: StockPreviewCardProps) {
    return (
        <PreviewMarketCard
            href={`/stock/${stock.code}`}
            label={stock.code}
            chartSeries={stock.chartSeries ?? []}
            latestPrice={stock.price}
            changePercent={stock.changePercent}
        />
    )
}
