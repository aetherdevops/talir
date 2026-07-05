'use client'

import type { DividendCalendarEntry } from '@/lib/dividends'
import {
    formatDividendRowDetail,
    latestDisclosedDividend,
    resolveProfitYear,
} from '@/lib/dividends'
import { formatNewsDate } from '@/lib/utils'

interface StockDividendOverviewTeaserProps {
    dividends: DividendCalendarEntry[]
    onViewDividends: () => void
}

export function StockDividendOverviewTeaser({
    dividends,
    onViewDividends,
}: StockDividendOverviewTeaserProps) {
    if (!dividends.length) return null

    const sorted = [...dividends].sort((a, b) =>
        (b.exDate ?? b.filedAt).localeCompare(a.exDate ?? a.filedAt)
    )
    const latestDisclosed = latestDisclosedDividend(sorted)
    const headline = latestDisclosed
        ? formatDividendRowDetail(latestDisclosed)
        : `Last filing ${formatNewsDate(sorted[0].filedAt)}`
    const fy = latestDisclosed ? resolveProfitYear(latestDisclosed) : null
    const isPartial = latestDisclosed?.parseStatus === 'partial'

    return (
        <section
            aria-labelledby="stock-dividend-teaser-heading"
            className="rounded-xl border border-border bg-surface p-4 md:p-5 space-y-3"
        >
            <div className="flex items-start justify-between gap-3 min-w-0">
                <div className="space-y-1 min-w-0">
                    <h2 id="stock-dividend-teaser-heading" className="text-sm font-semibold text-text-primary">
                        Dividends
                    </h2>
                    <p className="text-[11px] font-data text-text-tertiary leading-snug">
                        SECNet dividend calendars · end-of-day · not a forecast
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onViewDividends}
                    className="shrink-0 text-xs font-medium text-accent hover:underline min-h-[44px] px-2"
                >
                    View all
                </button>
            </div>

            <p className="font-data text-sm text-text-primary tabular-nums min-w-0">{headline}</p>

            {isPartial ? (
                <p className="text-[11px] font-data text-text-tertiary">
                    Partial parse from SECNet filing{fy ? ` · FY ${fy}` : ''} — open Dividends tab for full history.
                </p>
            ) : null}

            {!latestDisclosed && sorted.length > 0 ? (
                <p className="text-[11px] font-data text-text-tertiary">
                    {sorted.length} calendar{sorted.length === 1 ? '' : 's'} on file — amounts not parsed yet.
                </p>
            ) : null}
        </section>
    )
}
