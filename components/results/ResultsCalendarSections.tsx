import Link from 'next/link'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { ResultsCalendarRow, ExpectedResultsRow } from '@/components/results/ResultsCalendarRow'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { cn } from '@/lib/utils'

interface RecentResultsSectionProps {
    recent: ResultsCalendarEntry[]
    limit?: number
    showViewAll?: boolean
    showIssuerMeta?: boolean
    lastIssuerScan?: string | null
    issuerCount?: number
    className?: string
}

export function RecentResultsSection({
    recent,
    limit = 5,
    showViewAll = true,
    showIssuerMeta = false,
    lastIssuerScan,
    issuerCount,
    className,
}: RecentResultsSectionProps) {
    const items = recent.slice(0, limit)

    return (
        <section className={cn('space-y-1.5 min-w-0', className)} aria-labelledby="recent-results-heading">
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

            {items.length ? (
                <>
                    <p className="text-xs text-text-tertiary font-data truncate">
                        Filed on SECNet · not live estimates
                    </p>
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {items.map((entry) => (
                            <ResultsCalendarRow
                                key={`${entry.stockCode}-${entry.reportKind}-${entry.filedAt}`}
                                entry={entry}
                            />
                        ))}
                    </div>
                </>
            ) : (
                <p className="text-xs text-text-tertiary px-1">No recent result filings in the current issuer scan.</p>
            )}

            {showIssuerMeta && lastIssuerScan ? (
                <p className="text-[10px] font-data text-text-tertiary px-1 tabular-nums">
                    Last issuer scan {lastIssuerScan.replace(/-/g, '.')} · {issuerCount ?? 0} issuers in feed
                </p>
            ) : null}
        </section>
    )
}

interface ExpectedResultsSectionProps {
    expected: ExpectedResultsEntry[]
    limit?: number
    includeRegulatory?: boolean
    className?: string
}

export function ExpectedResultsSection({
    expected,
    limit = 5,
    includeRegulatory = false,
    className,
}: ExpectedResultsSectionProps) {
    const items = expected.slice(0, limit)

    if (!items.length) return null

    return (
        <section className={cn('space-y-1.5 min-w-0', className)} aria-labelledby="expected-results-heading">
            <div className="flex items-center gap-1.5 min-w-0">
                <h2 id="expected-results-heading" className="text-sm font-semibold font-heading text-text-primary">
                    Expected reports
                </h2>
                <InfoPopover label="Expected reports">
                    Not scheduled. Windows are inferred from each issuer&apos;s past filing dates on SECNet
                    {includeRegulatory ? ', with MSE listing-rule latest dates on this page' : ''}. No analyst
                    estimates.
                </InfoPopover>
            </div>
            <p className="text-xs text-text-tertiary font-data truncate">
                Expected, based on past filings — not a published schedule
            </p>
            <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                {items.map((entry) => (
                    <ExpectedResultsRow
                        key={`${entry.stockCode}-${entry.reportKind}-${entry.periodEnd}`}
                        entry={entry}
                        includeRegulatory={includeRegulatory}
                    />
                ))}
            </div>
        </section>
    )
}
