import * as React from 'react'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { cn } from '@/lib/utils'

// Using hash to generate pastel background colors for tickers
const getBadgeColor = (symbol: string) => {
    const colors = [
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
        'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
        'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
        'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300'
    ]
    let hash = 0
    for (let i = 0; i < symbol.length; i++) {
        hash = symbol.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colors[Math.abs(hash) % colors.length]
}

interface TickerBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    symbol: string
}

export function TickerBadge({ symbol, className, ...props }: TickerBadgeProps) {
    const colorClass = getBadgeColor(symbol)
    return (
        <span
            className={cn(
                'inline-flex items-center justify-center rounded-md px-2 py-1 text-xs font-bold tracking-wide uppercase shadow-sm border border-black/5 dark:border-white/5',
                colorClass,
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
