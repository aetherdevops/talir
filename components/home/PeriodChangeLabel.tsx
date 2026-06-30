import { ArrowDown, ArrowUp, Minus } from 'lucide-react'
import { cn, formatPriceChange } from '@/lib/utils'

interface PeriodChangeLabelProps {
    change: number
    className?: string
}

export function PeriodChangeLabel({ change, className }: PeriodChangeLabelProps) {
    const isPositive = change > 0
    const isNegative = change < 0
    const Icon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums',
                isPositive ? 'text-up' : isNegative ? 'text-down' : 'text-text-secondary',
                className
            )}
        >
            <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            {formatPriceChange(Math.abs(change))}
        </span>
    )
}
