'use client'

import { formatPrice, formatPriceChange } from '@/lib/utils'
import { PriceChangeBadge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'

interface StickyStockHeaderProps {
    code: string
    name: string
    price: number
    changePercent: number
    className?: string
}

export function StickyStockHeader({ code, price, changePercent, className }: StickyStockHeaderProps) {
    return (
        <div
            className={cn(
                'md:hidden sticky top-0 z-30 flex items-center justify-between gap-3',
                'border-b border-border bg-surface/95 backdrop-blur-md px-4 py-2 min-h-[52px]',
                className
            )}
        >
            <div className="min-w-0">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide">{code}</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-sm font-semibold text-text-primary tabular-nums">{formatPrice(price)}</span>
                <PriceChangeBadge change={changePercent} variant="pill" className="text-xs" />
            </div>
        </div>
    )
}
