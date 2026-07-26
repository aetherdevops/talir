'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { DividendCalendarEntry } from '@/lib/dividends'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn, formatInteger, formatPrice } from '@/lib/utils'

interface DividendRowProps {
    entry: DividendCalendarEntry
    className?: string
    /** Compact dense row for leaderboards (default). */
    dense?: boolean
}

function formatShortDate(iso: string): string {
    const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
    if (match) {
        return `${match[3]}.${match[2]}.${match[1].slice(2)}`
    }
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return iso
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = String(d.getFullYear()).slice(2)
    return `${day}.${month}.${year}`
}

function formatDps(entry: DividendCalendarEntry): string {
    if (entry.grossPerShare === null) return '—'
    const v = entry.grossPerShare
    if (Number.isInteger(v) || Math.abs(v - Math.round(v)) < 1e-9) {
        return `${formatInteger(Math.round(v))} ден.`
    }
    return formatPrice(v)
}

function formatDateCell(entry: DividendCalendarEntry): string {
    if (entry.exDate) return `ex ${formatShortDate(entry.exDate)}`
    if (entry.cumDate) return `cum ${formatShortDate(entry.cumDate)}`
    if (entry.recordDate) return `rec ${formatShortDate(entry.recordDate)}`
    return `filed ${formatShortDate(entry.filedAt)}`
}

export function DividendRow({ entry, className, dense = true }: DividendRowProps) {
    const { t } = useLocale()
    const yieldPct = entry.trailingYieldAtEx
    const hasSeinetDates = Boolean(entry.exDate || entry.cumDate || entry.recordDate)
    const isMseOnly =
        (entry.source === 'MSE' || entry.isSynthetic === true) &&
        !/seinet\.com\.mk/i.test(entry.url)
    const showMseBadge =
        isMseOnly ||
        (entry.sourceFields?.grossPerShare === 'MSE' && !hasSeinetDates)

    return (
        <div
            className={cn(
                'grid items-center gap-x-2 gap-y-0.5 min-w-0 min-h-9 py-1.5 px-1.5 border-b border-border/60 last:border-b-0',
                dense
                    ? 'grid-cols-[3.25rem_minmax(0,1fr)_auto_1.75rem] sm:grid-cols-[3.5rem_5.5rem_minmax(0,1fr)_auto_1.75rem]'
                    : 'grid-cols-[4rem_minmax(0,1fr)_auto_1.75rem]',
                className
            )}
        >
            <div className="min-w-0">
                <Link
                    href={`/stock/${entry.stockCode}`}
                    className="font-data text-xs font-semibold text-text-primary tabular-nums hover:text-accent"
                >
                    {entry.stockCode}
                </Link>
                {yieldPct !== null && Number.isFinite(yieldPct) ? (
                    <div className="font-data text-[10px] leading-tight text-text-tertiary tabular-nums sm:hidden">
                        {yieldPct.toFixed(2)}%
                    </div>
                ) : null}
            </div>

            {dense ? (
                <span className="hidden sm:block font-data text-[10px] text-text-tertiary tabular-nums">
                    {yieldPct !== null && Number.isFinite(yieldPct) ? `${yieldPct.toFixed(2)}%` : '—'}
                </span>
            ) : null}

            <span className="text-right font-data text-xs text-text-secondary tabular-nums whitespace-nowrap">
                {formatDps(entry)}
            </span>

            <span className="text-right font-data text-[11px] sm:text-xs text-text-secondary tabular-nums whitespace-nowrap">
                {formatDateCell(entry)}
                {showMseBadge ? (
                    <span
                        className="ml-1 inline-block rounded px-1 py-0.5 text-[9px] uppercase tracking-wider text-text-tertiary border border-border"
                        title={t('dividends.sourceMseHint')}
                    >
                        {t('dividends.sourceMse')}
                    </span>
                ) : null}
            </span>

            <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center h-7 w-7 text-text-tertiary hover:text-accent transition-colors justify-self-end"
                aria-label={t('results.openDividend', { code: entry.stockCode })}
            >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
        </div>
    )
}
