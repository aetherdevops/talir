'use client'

import { formatAsOfDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'

interface DataFreshnessLabelProps {
    asOfDate: string
    className?: string
    variant?: 'default' | 'compact'
}

export function DataFreshnessLabel({ asOfDate, className, variant = 'default' }: DataFreshnessLabelProps) {
    const { t } = useLocale()
    const formatted = formatAsOfDate(asOfDate)

    if (variant === 'compact') {
        return (
            <span className={cn('text-[11px] text-text-tertiary font-data', className)}>
                {t('freshness.eodCompact', { date: formatted })}
            </span>
        )
    }

    return (
        <p className={cn('text-xs text-text-tertiary', className)}>
            {t('freshness.dataAsOf')}{' '}
            <span className="font-medium text-text-secondary font-data">{formatted}</span>
            {' · '}
            <span className="text-text-tertiary">{t('freshness.eodNotLive')}</span>
        </p>
    )
}
