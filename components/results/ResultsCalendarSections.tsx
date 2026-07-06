'use client'

import Link from 'next/link'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { ResultsCalendarRow, ExpectedResultsRow } from '@/components/results/ResultsCalendarRow'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { useLocale } from '@/components/providers/LocaleProvider'
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
    const { t } = useLocale()
    const items = recent.slice(0, limit)

    return (
        <section className={cn('space-y-1.5 min-w-0', className)} aria-labelledby="recent-results-heading">
            <div className="flex items-center justify-between gap-3 min-w-0">
                <h2 id="recent-results-heading" className="text-sm font-semibold font-heading text-text-primary">
                    {t('filings.recentResults')}
                </h2>
                {showViewAll ? (
                    <Link
                        href="/markets?view=results"
                        className="text-xs font-medium text-accent hover:underline shrink-0"
                    >
                        {t('filings.viewAll')}
                    </Link>
                ) : null}
            </div>

            {items.length ? (
                <>
                    <p className="text-xs text-text-tertiary font-data truncate">{t('filings.secnetNotLive')}</p>
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
                <p className="text-xs text-text-tertiary px-1">{t('filings.noRecentResults')}</p>
            )}

            {showIssuerMeta && lastIssuerScan ? (
                <p className="text-[10px] font-data text-text-tertiary px-1 tabular-nums">
                    {t('filings.lastIssuerScan', { date: lastIssuerScan.replace(/-/g, '.') })} ·{' '}
                    {t('common.issuersInFeed', { count: issuerCount ?? 0 })}
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
    const { t } = useLocale()
    const items = expected.slice(0, limit)

    if (!items.length) return null

    const popoverBody = includeRegulatory
        ? `${t('filings.expectedPopoverBody')} ${t('results.regulatoryLatestPopover')}`
        : t('filings.expectedPopoverBody')

    return (
        <section className={cn('space-y-1.5 min-w-0', className)} aria-labelledby="expected-results-heading">
            <div className="flex items-center gap-1.5 min-w-0">
                <h2 id="expected-results-heading" className="text-sm font-semibold font-heading text-text-primary">
                    {t('filings.expectedReports')}
                </h2>
                <InfoPopover label={t('filings.expectedReports')}>{popoverBody}</InfoPopover>
            </div>
            <p className="text-xs text-text-tertiary font-data truncate">{t('filings.expectedHint')}</p>
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
