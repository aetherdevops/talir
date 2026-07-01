import * as React from 'react'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { cn } from '@/lib/utils'

interface TickerBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    symbol: string
}

export function TickerBadge({ symbol, className, ...props }: TickerBadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold tracking-wide uppercase font-data',
                'bg-surface-secondary text-text-secondary border border-border',
                className
            )}
            {...props}
        >
            {symbol}
        </span>
    )
}

interface PriceChangeBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    change: number
    variant?: 'pill' | 'text'
}

export function PriceChangeBadge({ change, variant = 'pill', className, ...props }: PriceChangeBadgeProps) {
    return (
        <ChangeLabel
            change={change}
            variant={variant === 'pill' ? 'pill' : 'inline'}
            iconStyle="diagonal"
            className={cn(className)}
            {...props}
        />
    )
}
