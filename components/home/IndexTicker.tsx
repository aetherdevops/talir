import Link from 'next/link'
import { MarketIndex } from "@/lib/types"
import { PriceChangeBadge } from "@/components/ui/Badge"
import { Card, CardContent } from "@/components/ui/Card"

interface IndexTickerProps {
    indices: MarketIndex[]
    children?: React.ReactNode
}

export function IndexTicker({ indices, children }: IndexTickerProps) {
    if ((!indices || indices.length === 0) && !children) return null

    return (
        <div className="w-full overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-4 min-w-max">
                {indices.map((idx) => (
                    <Link href={`/market/${idx.name}`} key={idx.name} className="block min-w-[280px]">
                        <Card className="h-full shadow-sm hover:shadow-md transition-shadow border-l-4 border-l-brand-600">
                            <CardContent className="p-4 flex items-center justify-between">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-text-secondary text-xs tracking-wider">{idx.name}</span>
                                        {idx.chartData && (
                                            // Simple Sparkline visualization
                                            <div className="flex gap-0.5 items-end h-4">
                                                {idx.chartData.map((d, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-1 rounded-t-sm ${idx.change >= 0 ? 'bg-success/50' : 'bg-danger/50'}`}
                                                        style={{ height: `${((d - Math.min(...idx.chartData!)) / (Math.max(...idx.chartData!) - Math.min(...idx.chartData!) || 1)) * 100}%` }}
                                                    />
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-xl font-bold text-text-primary">{idx.value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                                        <span className="text-xs text-text-tertiary">MKD</span>
                                    </div>
                                </div>
                                <PriceChangeBadge change={idx.changePercent} variant="pill" />
                            </CardContent>
                        </Card>
                    </Link>
                ))}

                {children}
            </div>
        </div>
    )
}
