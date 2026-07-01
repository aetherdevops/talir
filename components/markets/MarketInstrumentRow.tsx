'use client'

import Link from 'next/link'
import { formatPrice, formatInteger } from '@/lib/utils'
import { StockSummary } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { IndexSparkline } from '@/components/home/IndexSparkline'
import { StockPageActions } from '@/components/stock/StockPageActions'

interface MarketInstrumentRowProps {
    stock: StockSummary
    sparkline?: { date: string; value: number }[]
    className?: string
}

const SPARKLINE_WIDTH = 72
const SPARKLINE_HEIGHT = 28
const CHANGE_WIDTH = 72

export function MarketInstrumentRow({ stock, sparkline, className }: MarketInstrumentRowProps) {
    const series = sparkline ?? stock.chartSeries ?? []
    const isPositive = stock.changePercent >= 0

    return (
        <Link
            href={stock.type === 'Index' ? `/market/${stock.code}` : `/stock/${stock.code}`}
            className={cn(
                'flex items-center gap-3 min-h-[52px] px-4 py-2 hover:bg-surface-secondary/80 transition-colors group',
                className
            )}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="flex items-center justify-center rounded-md font-bold text-[11px] text-text-secondary bg-surface-secondary w-11 h-8 shrink-0 font-data">
                    {stock.code}
                </div>
                <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                    <span className="text-sm font-medium text-text-primary truncate leading-tight">
                        {stock.name}
                    </span>
                    {stock.type !== 'Index' && (
                        <span className="text-[10px] text-text-tertiary font-data leading-none">
                            Vol {formatInteger(stock.volume)}
                        </span>
                    )}
                </div>
            </div>

            <div
                className="shrink-0 overflow-hidden"
                style={{ width: SPARKLINE_WIDTH, height: SPARKLINE_HEIGHT }}
            >
                <IndexSparkline
                    series={series}
                    positive={isPositive}
                    height={SPARKLINE_HEIGHT}
                    className="w-[72px]"
                />
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <span className="text-xs sm:text-sm font-semibold text-text-primary font-data text-right min-w-[72px] sm:min-w-[88px]">
                    {formatPrice(stock.price)}
                </span>
                <div style={{ width: CHANGE_WIDTH }} className="flex justify-end">
                    <ChangeLabel change={stock.changePercent} className="text-xs" />
                </div>
            </div>

            <div
                className="shrink-0 border-l border-border/60 pl-2 ml-1"
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
            >
                <StockPageActions stockCode={stock.code} stockData={stock} variant="icon" />
            </div>
        </Link>
    )
}
