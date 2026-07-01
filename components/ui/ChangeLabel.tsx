import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight, Minus } from 'lucide-react'
import { cn, formatPriceChange } from '@/lib/utils'

interface ChangeLabelProps {
    change: number
    className?: string
    variant?: 'inline' | 'pill'
    iconStyle?: 'arrow' | 'diagonal'
}

export function ChangeLabel({
    change,
    className,
    variant = 'inline',
    iconStyle = 'arrow',
}: ChangeLabelProps) {
    const isPositive = change > 0
    const isNegative = change < 0

    const InlineIcon = isPositive ? ArrowUp : isNegative ? ArrowDown : Minus
    const PillIcon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus
    const Icon = iconStyle === 'diagonal' ? PillIcon : InlineIcon

    if (variant === 'pill') {
        if (!isPositive && !isNegative) {
            return (
                <span
                    className={cn(
                        'bg-surface-tertiary/50 text-text-tertiary px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 min-w-[72px] justify-center tabular-nums',
                        className
                    )}
                >
                    <Minus className="h-3 w-3" aria-hidden />
                    0.00%
                </span>
            )
        }

        return (
            <span
                className={cn(
                    'px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 min-w-[72px] justify-center tabular-nums border border-transparent',
                    isPositive ? 'text-up bg-up/10' : 'text-down bg-down/10',
                    className
                )}
            >
                <Icon className="h-3.5 w-3.5 -ml-0.5" strokeWidth={2.5} aria-hidden />
                {formatPriceChange(change)}
            </span>
        )
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 text-sm font-semibold tabular-nums',
                isPositive ? 'text-up' : isNegative ? 'text-down' : 'text-text-secondary',
                className
            )}
        >
            <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            {formatPriceChange(change)}
        </span>
    )
}
