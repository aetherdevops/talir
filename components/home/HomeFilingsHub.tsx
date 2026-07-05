import Link from 'next/link'
import type { NewsItem } from '@/lib/types'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { NewsCard } from '@/components/news/NewsCard'
import { FilingIndicatorLegend } from '@/components/news/FilingIndicatorLegend'
import { ResultsCalendarRow, ExpectedResultsRow } from '@/components/results/ResultsCalendarRow'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { UPDATES_SECTION_SUBTITLE, UPDATES_SECTION_TITLE } from '@/lib/news-style'

interface HomeFilingsHubProps {
    news: NewsItem[]
    recentResults: ResultsCalendarEntry[]
    expectedResults: ExpectedResultsEntry[]
    lastIssuerScan?: string | null
}

export function HomeFilingsHub({
    news,
    recentResults,
    expectedResults,
    lastIssuerScan,
}: HomeFilingsHubProps) {
    const filingItems = news.slice(0, 5)
    const resultItems = recentResults.slice(0, 5)
    const expectedItems = expectedResults.slice(0, 5)

    return (
        <section className="space-y-4 min-w-0" aria-labelledby="home-filings-hub-heading">
            <header className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-3 min-w-0">
                    <h2
                        id="home-filings-hub-heading"
                        className="font-heading text-base font-bold text-text-primary tracking-tight"
                    >
                        {UPDATES_SECTION_TITLE}
                    </h2>
                    <Link href="/news" className="text-xs font-medium text-accent hover:underline shrink-0">
                        View all
                    </Link>
                </div>
                <p className="text-xs text-text-tertiary">{UPDATES_SECTION_SUBTITLE}</p>
            </header>

            <FilingsSubBlock title="Latest filings" href="/news" hrefLabel="All filings">
                {filingItems.length ? (
                    <div className="min-w-0 space-y-1.5">
                        {filingItems.map((item) => (
                            <NewsCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-text-tertiary px-1">No filings in the current feed.</p>
                )}
            </FilingsSubBlock>

            <FilingsSubBlock title="Recent results" href="/markets?view=results" hrefLabel="All results">
                <p className="text-xs text-text-tertiary font-data truncate mb-1.5">
                    Filed on SECNet · not live estimates
                </p>
                {resultItems.length ? (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {resultItems.map((entry) => (
                            <ResultsCalendarRow
                                key={`${entry.stockCode}-${entry.reportKind}-${entry.filedAt}`}
                                entry={entry}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-text-tertiary px-1">No recent result filings.</p>
                )}
                {lastIssuerScan ? (
                    <p className="text-[10px] font-data text-text-tertiary px-1 tabular-nums mt-1.5">
                        Last issuer scan {lastIssuerScan.replace(/-/g, '.')}
                    </p>
                ) : null}
            </FilingsSubBlock>

            {expectedItems.length > 0 && (
                <FilingsSubBlock title="Expected reports" href="/markets?view=results" hrefLabel="All expected">
                    <div className="flex items-center gap-1 mb-1.5">
                        <p className="text-xs text-text-tertiary font-data truncate flex-1">
                            Expected, based on past filings — not a published schedule
                        </p>
                        <InfoPopover label="Expected reports">
                            Not scheduled. Windows are inferred from each issuer&apos;s past filing dates on SECNet. No
                            analyst estimates.
                        </InfoPopover>
                    </div>
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {expectedItems.map((entry) => (
                            <ExpectedResultsRow
                                key={`${entry.stockCode}-${entry.reportKind}-${entry.periodEnd}`}
                                entry={entry}
                            />
                        ))}
                    </div>
                </FilingsSubBlock>
            )}

            <FilingIndicatorLegend stacked className="pt-1" />
        </section>
    )
}

function FilingsSubBlock({
    title,
    href,
    hrefLabel,
    children,
}: {
    title: string
    href: string
    hrefLabel: string
    children: React.ReactNode
}) {
    return (
        <div className="space-y-1.5 min-w-0 pt-3 border-t border-border/60 first:border-t-0 first:pt-0">
            <div className="flex items-center justify-between gap-2 min-w-0">
                <h3 className="text-sm font-semibold font-heading text-text-primary">{title}</h3>
                <Link href={href} className="text-xs font-medium text-accent hover:underline shrink-0">
                    {hrefLabel}
                </Link>
            </div>
            {children}
        </div>
    )
}
