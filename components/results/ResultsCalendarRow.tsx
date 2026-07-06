'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { formatExpectedResultsLine, formatFiledResultsLine } from '@/lib/results-calendar'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

interface ResultsCalendarRowProps {
    entry: ResultsCalendarEntry
    className?: string
}

export function ResultsCalendarRow({ entry, className }: ResultsCalendarRowProps) {
    const { t } = useLocale()
    const detail = formatFiledResultsLine(entry)

    return (
        <div
            className={cn(
                'flex items-center gap-2 min-w-0 h-9 px-1 border-b border-border/60 last:border-b-0',
                className
            )}
        >
            <Link
                href={`/stock/${entry.stockCode}`}
                className="shrink-0 font-data text-xs font-semibold text-text-primary tabular-nums hover:text-accent"
            >
                {entry.stockCode}
            </Link>
            <span className="text-text-tertiary font-data text-xs shrink-0" aria-hidden>
                ·
            </span>
            <span className="flex-1 min-w-0 truncate font-data text-xs text-text-secondary tabular-nums">
                {detail}
            </span>
            <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center justify-center h-7 w-7 text-text-tertiary hover:text-accent transition-colors"
                aria-label={t('results.openFiling', { code: entry.stockCode })}
            >
                <ExternalLink className="h-3.5 w-3.5" aria-hidden />
            </a>
        </div>
    )
}

interface ExpectedResultsRowProps {
    entry: ExpectedResultsEntry
    includeRegulatory?: boolean
    className?: string
}

export function ExpectedResultsRow({
    entry,
    includeRegulatory = false,
    className,
}: ExpectedResultsRowProps) {
    const detail = formatExpectedResultsLine(entry, includeRegulatory)

    return (
        <div
            className={cn(
                'flex items-center gap-2 min-w-0 h-9 px-1 border-b border-border/60 last:border-b-0',
                className
            )}
        >
            <Link
                href={`/stock/${entry.stockCode}`}
                className="shrink-0 font-data text-xs font-semibold text-text-primary tabular-nums hover:text-accent"
            >
                {entry.stockCode}
            </Link>
            <span className="text-text-tertiary font-data text-xs shrink-0" aria-hidden>
                ·
            </span>
            <span className="flex-1 min-w-0 truncate font-data text-xs text-text-secondary tabular-nums capitalize">
                {detail}
            </span>
        </div>
    )
}
