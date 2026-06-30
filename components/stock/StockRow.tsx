"use client"

import Link from 'next/link'
import { formatPrice, formatPriceCompact, formatInteger } from '@/lib/utils'
import { StockSummary } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PriceChangeBadge } from '@/components/ui/Badge'
import { StockPageActions } from './StockPageActions'

interface StockRowProps {
    stock: StockSummary
    showVolume?: boolean
    variant?: 'default' | 'compact'
    className?: string
}

export function StockRow({ stock, showVolume = false, variant = 'default', className }: StockRowProps) {
    const isCompact = variant === 'compact'
    const priceLabel = isCompact ? formatPriceCompact(stock.price) : formatPrice(stock.price)

    return (
        <Link
            href={stock.type === 'Index' ? `/market/${stock.code}` : `/stock/${stock.code}`}
            className={cn(
                "flex items-center gap-3 hover:bg-surface-secondary transition-colors cursor-pointer group min-h-[44px]",
                isCompact ? "px-3 py-2.5" : "px-4 py-3 justify-between",
                className
            )}
        >
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className={cn(
                    "flex items-center justify-center rounded-lg font-bold text-xs text-text-secondary bg-surface-secondary flex-shrink-0",
                    isCompact ? "w-10 h-8" : "w-12 h-8"
                )}>
                    {stock.code}
                </div>
                <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-sm font-medium text-text-primary truncate">
                        {stock.name}
                    </span>
                    {showVolume && (
                        <span className="text-[10px] text-text-tertiary tabular-nums">
                            Vol: {formatInteger(stock.volume)}
                        </span>
                    )}
                </div>
            </div>

            <div className={cn("flex items-center gap-3 flex-shrink-0", !isCompact && "text-right")}>
                <span className={cn(
                    "text-sm font-medium text-text-primary tabular-nums whitespace-nowrap",
                    isCompact ? "text-xs sm:text-sm" : "font-mono"
                )}>
                    {priceLabel}
                </span>
                {!isCompact && (
                    <>
                        <PriceChangeBadge change={stock.changePercent} variant="pill" className="w-[72px]" />
                        <div
                            className="flex items-center ml-1 border-l border-border pl-3"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation() }}
                        >
                            <StockPageActions stockCode={stock.code} stockData={stock} variant="icon" />
                        </div>
                    </>
                )}
            </div>
        </Link>
    )
}
