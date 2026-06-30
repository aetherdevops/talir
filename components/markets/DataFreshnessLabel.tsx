import { formatAsOfDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface DataFreshnessLabelProps {
    asOfDate: string
    className?: string
    variant?: 'default' | 'compact'
}

export function DataFreshnessLabel({ asOfDate, className, variant = 'default' }: DataFreshnessLabelProps) {
    const formatted = formatAsOfDate(asOfDate)

    if (variant === 'compact') {
        return (
            <span className={cn('text-[11px] text-text-tertiary tabular-nums', className)}>
                End-of-day · {formatted}
            </span>
        )
    }

    return (
        <p className={cn('text-xs text-text-tertiary', className)}>
            Data as of <span className="font-medium text-text-secondary tabular-nums">{formatted}</span>
            {' · '}
            <span className="text-text-tertiary">end-of-day close, not live</span>
        </p>
    )
}
