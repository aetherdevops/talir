import type { NewsItem } from '@/lib/types'
import { NewsCard } from '@/components/news/NewsCard'
import { UPDATES_SECTION_TITLE } from '@/lib/news-style'

interface StockFilingsSectionProps {
    dated: NewsItem[]
    undated: NewsItem[]
}

export function StockFilingsSection({ dated, undated }: StockFilingsSectionProps) {
    if (!dated.length && !undated.length) {
        return (
            <div className="text-center py-12 text-text-tertiary text-sm rounded-xl border border-dashed border-border">
                No updates available for this company.
            </div>
        )
    }

    return (
        <div className="space-y-6">
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
