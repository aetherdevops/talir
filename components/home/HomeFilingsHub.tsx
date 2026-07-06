'use client'

import type { NewsItem } from '@/lib/types'
import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { NewsCard } from '@/components/news/NewsCard'
import { FilingIndicatorLegend } from '@/components/news/FilingIndicatorLegend'
import { ResultsCalendarRow, ExpectedResultsRow } from '@/components/results/ResultsCalendarRow'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'

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
    const { t } = useLocale()

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
                        {t('filings.updates')}
                    </h2>
                    <LocaleLink href="/news" className="text-xs font-medium text-accent hover:underline shrink-0">
                        {t('filings.viewAll')}
                    </LocaleLink>
                </div>
                <p className="text-xs text-text-tertiary">{t('filings.hubDescription')}</p>
            </header>

            <FilingsSubBlock title={t('filings.latestFilings')} href="/news" hrefLabel={t('filings.allFilings')}>
                {filingItems.length ? (
                    <div className="min-w-0 space-y-1.5">
                        {filingItems.map((item) => (
                            <NewsCard key={item.id} item={item} />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-text-tertiary px-1">{t('filings.noFilings')}</p>
                )}
            </FilingsSubBlock>

            <FilingsSubBlock
                title={t('filings.recentResults')}
                href="/markets?view=results"
                hrefLabel={t('filings.allResults')}
            >
                <p className="text-xs text-text-tertiary font-data truncate mb-1.5">
                    {t('filings.secnetNotLive')}
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
                    <p className="text-xs text-text-tertiary px-1">{t('filings.noRecentResults')}</p>
                )}
                {lastIssuerScan ? (
                    <p className="text-[10px] font-data text-text-tertiary px-1 tabular-nums mt-1.5">
                        {t('filings.lastIssuerScan', { date: lastIssuerScan.replace(/-/g, '.') })}
                    </p>
                ) : null}
            </FilingsSubBlock>

            {expectedItems.length > 0 && (
                <FilingsSubBlock
                    title={t('filings.expectedReports')}
                    href="/markets?view=results"
                    hrefLabel={t('filings.allExpected')}
                >
                    <div className="flex items-center gap-1 mb-1.5">
                        <p className="text-xs text-text-tertiary font-data truncate flex-1">
                            {t('filings.expectedHint')}
                        </p>
                        <InfoPopover label={t('filings.expectedReports')}>
                            {t('filings.expectedPopoverBody')}
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
                <LocaleLink href={href} className="text-xs font-medium text-accent hover:underline shrink-0">
                    {hrefLabel}
                </LocaleLink>
            </div>
            {children}
        </div>
    )
}
