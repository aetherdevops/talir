import Link from 'next/link'
import { Card } from '@/components/ui/Card'
import { PriceChangeBadge } from '@/components/ui/Badge'
import { formatPrice } from '@/lib/utils'
import { StockSummary } from '@/lib/types'

interface StockCardProps {
    stock: StockSummary
}

export function StockCard({ stock }: StockCardProps) {
    return (
        <Link href={`/stock/${stock.code}`}>
            <Card interactive className="p-4 flex flex-col gap-3 group">
                <div className="flex justify-between items-start">
                    <div className="bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400 px-2 py-1 rounded text-xs font-bold tracking-wider">
                        {stock.code}
                    </div>
                    <PriceChangeBadge change={stock.changePercent} />
                </div>

                <div className="flex flex-col gap-1">
                    <h3 className="text-sm font-medium text-text-primary line-clamp-1 group-hover:text-brand-active transition-colors" title={stock.name}>
                        {stock.name}
                    </h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-lg font-mono font-bold text-text-primary">
                            {formatPrice(stock.price)}
                        </span>
                    </div>
                </div>
            </Card>
        </Link>
    )
}
