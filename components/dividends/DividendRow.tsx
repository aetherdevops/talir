'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { DividendCalendarEntry } from '@/lib/dividends'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

interface DividendRowProps {
    entry: DividendCalendarEntry
    className?: string
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
    return `${entry.grossPerShare.toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
    })} ден.`
}

function formatDateCell(entry: DividendCalendarEntry): string {
    if (entry.exDate) return `ex ${formatShortDate(entry.exDate)}`
    if (entry.cumDate) return `cum ${formatShortDate(entry.cumDate)}`
    if (entry.recordDate) return `rec ${formatShortDate(entry.recordDate)}`
    return `filed ${formatShortDate(entry.filedAt)}`
}

export function DividendRow({ entry, className }: DividendRowProps) {
    const { t } = useLocale()
    const yieldPct = entry.trailingYieldAtEx

    return (
        <div
            className={cn(
                'flex items-center gap-2 min-w-0 min-h-9 py-1 px-1 border-b border-border/60 last:border-b-0',
                className
            )}
        >
            <div className="shrink-0 w-[52px] min-w-0">
                <Link
                    href={`/stock/${entry.stockCode}`}
                    className="font-data text-xs font-semibold text-text-primary tabular-nums hover:text-accent"
                >
                    {entry.stockCode}
                </Link>
                {yieldPct !== null && Number.isFinite(yieldPct) ? (
                    <div className="font-data text-[10px] leading-tight text-text-tertiary tabular-nums">
                        {yieldPct.toFixed(2)}%
                    </div>
                ) : null}
            </div>
            <span className="shrink-0 w-[72px] text-right font-data text-xs text-text-secondary tabular-nums">
                {formatDps(entry)}
            </span>
            <span className="flex-1 min-w-0 truncate text-right font-data text-xs text-text-secondary tabular-nums">
                {formatDateCell(entry)}
            </span>
            <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center h-7 w-7 text-text-tertiary hover:text-accent transition-colors"
                aria-label={t('results.openDividend', { code: entry.stockCode })}
            >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
        </div>
    )
}
