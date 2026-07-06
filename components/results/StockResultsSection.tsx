'use client'

import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { ResultsCalendarRow } from '@/components/results/ResultsCalendarRow'
import { ExpectedResultsSection } from '@/components/results/ResultsCalendarSections'
import { useLocale } from '@/components/providers/LocaleProvider'

interface StockResultsSectionProps {
    results: ResultsCalendarEntry[]
    expected: ExpectedResultsEntry[]
}

export function StockResultsSection({ results, expected }: StockResultsSectionProps) {
    const { t } = useLocale()

    if (!results.length && !expected.length) return null

    return (
        <div className="space-y-6">
            {results.length > 0 && (
                <section className="space-y-2" aria-labelledby="stock-results-heading">
                    <h3 id="stock-results-heading" className="text-sm font-semibold font-heading text-text-primary">
                        {t('results.stockHeading')}
                    </h3>
                    <p className="text-[11px] font-data text-text-tertiary">{t('results.stockSubtitle')}</p>
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {results.slice(0, 6).map((entry) => (
                            <ResultsCalendarRow key={`${entry.reportKind}-${entry.filedAt}`} entry={entry} />
                        ))}
                    </div>
                </section>
            )}

            <ExpectedResultsSection expected={expected} limit={3} includeRegulatory />
        </div>
    )
}
