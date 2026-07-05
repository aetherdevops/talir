import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { ResultsCalendarEntry } from '@/lib/results-calendar'
import { REPORT_KIND_LABELS } from '@/lib/results-calendar'
import { cn, formatNewsDate } from '@/lib/utils'

interface ResultsCalendarRowProps {
    entry: ResultsCalendarEntry
    compact?: boolean
    className?: string
}

export function ResultsCalendarRow({ entry, compact = false, className }: ResultsCalendarRowProps) {
    const period = entry.periodLabel ?? entry.periodEnd ?? '—'

    return (
        <div
            className={cn(
                'flex items-center gap-3 min-w-0 py-2.5 px-3 rounded-lg bg-surface-secondary/50 hover:bg-surface-secondary transition-colors',
                className
            )}
        >
            <Link
                href={`/stock/${entry.stockCode}`}
                className="shrink-0 font-data text-sm font-semibold text-text-primary tabular-nums hover:text-accent min-w-[3.25rem]"
            >
                {entry.stockCode}
            </Link>

            <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 min-w-0">
                    <span className="text-xs font-data text-text-secondary tabular-nums">
                        {REPORT_KIND_LABELS[entry.reportKind]}
                    </span>
                    {!compact && entry.stockName ? (
                        <span className="text-xs text-text-tertiary truncate hidden sm:inline">
                            {entry.stockName}
                        </span>
                    ) : null}
                </div>
                <div className="text-[11px] font-data text-text-tertiary tabular-nums mt-0.5">
                    {period !== '—' ? `period ${period}` : 'period not stated'} · filed{' '}
                    {formatNewsDate(entry.filedAt)}
                </div>
            </div>

            <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center h-8 w-8 rounded-lg text-text-tertiary hover:text-accent hover:bg-surface transition-colors"
                aria-label={`Open SECNet filing for ${entry.stockCode}`}
            >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
        </div>
    )
}
