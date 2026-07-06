'use client'

import type { NewsItem } from '@/lib/types'
import type { DividendCalendarEntry } from '@/lib/dividends'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { NewsCard } from '@/components/news/NewsCard'
import { StockResultsSection } from '@/components/results/StockResultsSection'
import { StockDividendsSection } from '@/components/dividends/StockDividendsSection'
import { useLocale } from '@/components/providers/LocaleProvider'

interface StockFilingsSectionProps {
    dated: NewsItem[]
    undated: NewsItem[]
    results?: ResultsCalendarEntry[]
    expected?: ExpectedResultsEntry[]
    dividends?: DividendCalendarEntry[]
    onViewDividends?: () => void
}

export function StockFilingsSection({
    dated,
    undated,
    results = [],
    expected = [],
    dividends = [],
    onViewDividends,
}: StockFilingsSectionProps) {
    const { t } = useLocale()

    if (!dated.length && !undated.length && !results.length && !expected.length && !dividends.length) {
        return (
            <div className="text-center py-12 text-text-tertiary text-sm rounded-xl border border-dashed border-border">
                {t('filings.noUpdates')}
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <StockResultsSection results={results} expected={expected} />
            <StockDividendsSection dividends={dividends} onViewDividends={onViewDividends} />

            {(dated.length > 0 || undated.length > 0) && (results.length > 0 || expected.length > 0 || dividends.length > 0) ? (
                <h3 className="text-sm font-semibold text-text-secondary font-heading pt-2 border-t border-border">
                    {t('filings.allFilingsHeading')}
                </h3>
            ) : null}

            {dated.length > 0 && (
                <div className="space-y-2">
                    {dated.map((item) => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}

            {undated.length > 0 && (
                <section className="space-y-3 pt-4 border-t border-border">
                    <h3 className="text-sm font-semibold text-text-secondary font-heading">
                        {t('filings.updates')} {t('filings.dateUnknown')}
                    </h3>
                    <div className="space-y-2 opacity-90">
                        {undated.map((item) => (
                            <NewsCard key={item.id} item={item} />
                        ))}
                    </div>
                </section>
            )}
        </div>
    )
}
