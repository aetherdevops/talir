import Link from 'next/link'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { REPORT_KIND_LABELS } from '@/lib/results-calendar'
import { ResultsCalendarRow } from '@/components/results/ResultsCalendarRow'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { cn, formatNewsDate } from '@/lib/utils'

interface RecentResultsSectionProps {
    recent: ResultsCalendarEntry[]
    lastIssuerScan: string | null
    issuerCount: number
    limit?: number
    showViewAll?: boolean
    className?: string
}

export function RecentResultsSection({
    recent,
    lastIssuerScan,
    issuerCount,
    limit = 8,
    showViewAll = true,
    className,
}: RecentResultsSectionProps) {
    const items = recent.slice(0, limit)

    if (!items.length) {
        return (
            <section className={cn('space-y-2', className)}>
                <SectionHeader showViewAll={showViewAll} />
                <p className="text-sm text-text-tertiary px-1">
                    No recent result filings in the current issuer scan.
                </p>
            </section>
        )
    }

    return (
        <section className={cn('space-y-2', className)} aria-labelledby="recent-results-heading">
            <SectionHeader showViewAll={showViewAll} />
            <p className="text-[11px] font-data text-text-tertiary px-1">
                Filed on SECNet · filing date shown · not live estimates
            </p>
            <div className="space-y-1.5">
                {items.map((entry) => (
                    <ResultsCalendarRow key={`${entry.stockCode}-${entry.reportKind}-${entry.filedAt}`} entry={entry} compact />
                ))}
            </div>
            {lastIssuerScan ? (
                <p className="text-[10px] font-data text-text-tertiary px-1 tabular-nums">
                    Last issuer scan {lastIssuerScan.replace(/-/g, '.')} · {issuerCount} issuers in feed
                </p>
            ) : null}
        </section>
    )
}

function SectionHeader({ showViewAll }: { showViewAll: boolean }) {
    return (
        <div className="flex items-center justify-between gap-3 min-w-0">
            <h2 id="recent-results-heading" className="text-sm font-semibold font-heading text-text-primary">
                Recent results
            </h2>
            {showViewAll ? (
                <Link
                    href="/markets?view=results"
                    className="text-xs font-medium text-accent hover:underline shrink-0"
                >
                    View all
                </Link>
            ) : null}
        </div>
    )
}

interface ExpectedResultsSectionProps {
    expected: ExpectedResultsEntry[]
    limit?: number
    className?: string
}

export function ExpectedResultsSection({ expected, limit = 5, className }: ExpectedResultsSectionProps) {
    const items = expected.slice(0, limit)

    if (!items.length) return null

    return (
        <section className={cn('space-y-2', className)} aria-labelledby="expected-results-heading">
            <div className="flex items-center gap-1.5 min-w-0">
                <h2 id="expected-results-heading" className="text-sm font-semibold font-heading text-text-primary">
                    Expected reports
                </h2>
                <InfoPopover label="Expected reports">
                    Not scheduled. Windows are inferred from each issuer&apos;s past filing dates on SECNet, or
                    shown alongside MSE listing-rule latest dates. No analyst estimates.
                </InfoPopover>
            </div>
            <p className="text-[11px] font-data text-text-tertiary px-1">
                Expected, based on past filings — not a published schedule
            </p>
            <div className="space-y-1.5">
                {items.map((entry) => (
                    <ExpectedResultsRow key={`${entry.stockCode}-${entry.reportKind}-${entry.periodEnd}`} entry={entry} />
                ))}
            </div>
        </section>
    )
}

function ExpectedResultsRow({ entry }: { entry: ExpectedResultsEntry }) {
    return (
        <div className="flex items-start gap-3 min-w-0 py-2.5 px-3 rounded-lg bg-surface-secondary/30">
            <Link
                href={`/stock/${entry.stockCode}`}
                className="shrink-0 font-data text-sm font-semibold text-text-primary tabular-nums hover:text-accent min-w-[3.25rem]"
            >
                {entry.stockCode}
            </Link>
            <div className="flex-1 min-w-0 text-xs">
                <div className="font-data text-text-secondary tabular-nums">
                    {REPORT_KIND_LABELS[entry.reportKind]} · {entry.periodLabel}
                </div>
                <div className="font-data text-text-tertiary tabular-nums mt-0.5 capitalize">
                    {entry.expectedLabel}
                    {entry.regulatoryLatest ? (
                        <span className="normal-case">
                            {' '}
                            · regulatory latest {formatNewsDate(entry.regulatoryLatest)}
                        </span>
                    ) : null}
                </div>
            </div>
        </div>
    )
}
