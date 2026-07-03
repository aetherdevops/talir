import { ArrowDown, ArrowDownRight, ArrowUp, ArrowUpRight } from 'lucide-react'
import { cn, classifyChangePercent, formatPriceChange } from '@/lib/utils'

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
    const direction = classifyChangePercent(change)
    const isPositive = direction === 'up'
    const isNegative = direction === 'down'

    const InlineIcon = isPositive ? ArrowUp : ArrowDown
    const PillIcon = isPositive ? ArrowUpRight : ArrowDownRight
    const Icon = iconStyle === 'diagonal' ? PillIcon : InlineIcon

    if (variant === 'pill') {
        if (direction === 'neutral') {
            return (
                <span
                    className={cn(
                        'bg-surface-tertiary/50 text-neutral px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center justify-center min-w-[72px] font-data',
                        className
                    )}
                >
                    0.00%
                </span>
            )
        }

        return (
            <span
                className={cn(
                    'px-2 py-1 rounded-lg text-xs font-bold inline-flex items-center gap-1 min-w-[72px] justify-center font-data border border-transparent',
                    isPositive ? 'text-up bg-up/10' : 'text-down bg-down/10',
                    className
                )}
            >
                <Icon className="h-3.5 w-3.5 -ml-0.5" strokeWidth={2.5} aria-hidden />
                {formatPriceChange(change)}
            </span>
        )
    }

    if (direction === 'neutral') {
        return (
            <span
                className={cn(
                    'inline-flex items-center text-sm font-semibold font-data text-neutral',
                    className
                )}
            >
                {formatPriceChange(change)}
            </span>
        )
    }

    return (
        <span
            className={cn(
                'inline-flex items-center gap-0.5 text-sm font-semibold font-data',
                isPositive ? 'text-up' : 'text-down',
                className
            )}
        >
            <Icon className="h-3 w-3" strokeWidth={2.5} aria-hidden />
            {formatPriceChange(change)}
        </span>
    )
}
