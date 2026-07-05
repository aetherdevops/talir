import type { NewsItem } from '@/lib/types'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { NewsCard } from '@/components/news/NewsCard'
import { StockResultsSection } from '@/components/results/StockResultsSection'
import { UPDATES_SECTION_TITLE } from '@/lib/news-style'

interface StockFilingsSectionProps {
    dated: NewsItem[]
    undated: NewsItem[]
    results?: ResultsCalendarEntry[]
    expected?: ExpectedResultsEntry[]
}

export function StockFilingsSection({
    dated,
    undated,
    results = [],
    expected = [],
}: StockFilingsSectionProps) {
    if (!dated.length && !undated.length && !results.length && !expected.length) {
        return (
            <div className="text-center py-12 text-text-tertiary text-sm rounded-xl border border-dashed border-border">
                No updates available for this company.
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <StockResultsSection results={results} expected={expected} />

            {(dated.length > 0 || undated.length > 0) && (results.length > 0 || expected.length > 0) ? (
                <h3 className="text-sm font-semibold text-text-secondary font-heading pt-2 border-t border-border">
                    All filings
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
                        {UPDATES_SECTION_TITLE} — date unknown
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
