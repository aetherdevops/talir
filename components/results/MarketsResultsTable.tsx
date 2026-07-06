'use client'

import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { ResultsCalendarRow } from '@/components/results/ResultsCalendarRow'
import { ExpectedResultsSection } from '@/components/results/ResultsCalendarSections'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { useLocale } from '@/components/providers/LocaleProvider'

interface MarketsResultsTableProps {
    results: ResultsCalendarEntry[]
    expected: ExpectedResultsEntry[]
    lastIssuerScan: string | null
    issuerCount: number
}

export function MarketsResultsTable({
    results,
    expected,
    lastIssuerScan,
    issuerCount,
}: MarketsResultsTableProps) {
    const { t } = useLocale()

    return (
        <div className="space-y-6 min-w-0">
            <section className="space-y-1.5 min-w-0" aria-labelledby="markets-recent-results">
                <header className="space-y-1 min-w-0">
                    <h2 id="markets-recent-results" className="text-lg font-semibold font-heading text-text-primary">
                        {t('markets.recentResults')}
                    </h2>
                    <p className="text-xs text-text-tertiary font-data">{t('filings.secnetNotLive')}</p>
                    {lastIssuerScan ? (
                        <p className="text-[10px] font-data text-text-tertiary tabular-nums">
                            {t('filings.lastIssuerScan', { date: lastIssuerScan.replace(/-/g, '.') })} ·{' '}
                            {t('common.issuersInFeed', { count: issuerCount })}
                        </p>
                    ) : null}
                </header>

                {results.length ? (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {results.map((entry) => (
                            <ResultsCalendarRow
                                key={`${entry.stockCode}-${entry.reportKind}-${entry.filedAt}`}
                                entry={entry}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary py-6 text-center border border-dashed border-border rounded-xl">
                        {t('filings.noRecentResults')}
                    </p>
                )}
            </section>

            <ExpectedResultsSection expected={expected} limit={20} includeRegulatory />

            <section className="space-y-2 pt-2 border-t border-border min-w-0">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold font-heading text-text-primary">{t('results.regulatoryLatestDates')}</h3>
                    <InfoPopover label={t('results.regulatoryLatestDates')}>{t('results.regulatoryLatestPopover')}</InfoPopover>
                </div>
                <ul className="text-xs font-data text-text-tertiary space-y-1 tabular-nums px-1">
                    <li>{t('results.regulatoryQ1')}</li>
                    <li>{t('results.regulatoryH1')}</li>
                    <li>{t('results.regulatory9M')}</li>
                    <li>{t('results.regulatoryFy')}</li>
                </ul>
            </section>
        </div>
    )
}
