'use client'

import { formatPrice } from '@/lib/utils'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { cn } from '@/lib/utils'

interface StickyStockHeaderProps {
    code: string
    name: string
    price: number
    changePercent: number
    className?: string
}

export function StickyStockHeader({ code, name, price, changePercent, className }: StickyStockHeaderProps) {
    return (
        <div
            className={cn(
                'sticky top-0 z-30 flex items-center justify-between gap-3',
                'border-b border-border bg-surface/95 backdrop-blur-md px-0 py-2 min-h-[44px]',
                className
            )}
        >
            <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wide font-data">{code}</p>
                <p className="text-[11px] text-text-tertiary truncate">{name}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
                <span className="text-sm font-semibold text-text-primary tabular-nums font-data">
                    {formatPrice(price)}
                </span>
                <ChangeLabel change={changePercent} variant="pill" className="text-xs" />
            </div>
        </div>
    )
}
