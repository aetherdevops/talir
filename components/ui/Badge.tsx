import * as React from 'react'
import { cn, formatPriceChange } from '@/lib/utils'
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react'

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
    const isPositive = change > 0
    const isNegative = change < 0
    const isZero = change === 0

    const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus

    if (variant === 'text') {
        return (
            <span
                className={cn(
                    'font-medium inline-flex items-center gap-1',
                    isPositive ? 'text-emerald-600 dark:text-emerald-400 font-bold' : isNegative ? 'text-red-600 dark:text-red-400 font-bold' : 'text-text-secondary',
                    className
                )}
                {...props}
            >
                {/* Text Variant: Icon is smaller */}
                <Icon className="h-3.5 w-3.5" strokeWidth={2.5} />
                {formatPriceChange(Math.abs(change))}
            </span>
        )
    }

    // PILL VARIANT (Default for Tables)
    // 0% CASE: Remove colored badge, use neutral grey pill or minimal look.
    if (isZero) {
        return (
            <span
                className={cn(
                    'bg-surface-tertiary/50 text-text-tertiary px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 min-w-[72px] justify-center',
                    // min-w-[72px] ensures uniformity with other percentages like 1.50%
                    className
                )}
                {...props}
            >
                <Minus className="h-3 w-3" />
                0.00%
            </span>
        )
    }

    return (
        <span
            className={cn(
                'px-2 py-1 rounded-lg text-xs font-bold font-mono inline-flex items-center gap-1 min-w-[72px] justify-center shadow-sm border border-transparent',
                isPositive
                    ? 'text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-500/10'
                    : 'text-red-700 bg-red-100 dark:text-red-400 dark:bg-red-500/10',
                className
            )}
            {...props}
        >
            {/* Arrow BEFORE the number */}
            <Icon className="h-3.5 w-3.5 -ml-1" strokeWidth={3} />
            {Math.abs(change).toFixed(2)}%
        </span>
    )
}
