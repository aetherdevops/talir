'use client'

import type { DividendCalendarEntry } from '@/lib/dividends'
import { DividendRow } from '@/components/dividends/DividendRow'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

interface HomeDividendsPanelProps {
    recent: DividendCalendarEntry[]
    upcoming: DividendCalendarEntry[]
    variant?: 'aside' | 'mobile'
    className?: string
}

export function HomeDividendsPanel({
    recent,
    upcoming,
    variant = 'aside',
    className,
}: HomeDividendsPanelProps) {
    const { t } = useLocale()
    const recentItems = recent.slice(0, 5)
    const upcomingItems = upcoming.slice(0, 5)
    const isAside = variant === 'aside'

    return (
        <section
            className={cn(
                'space-y-3 min-w-0',
                isAside && 'sticky top-4',
                className
            )}
            aria-labelledby="home-dividends-heading"
        >
            <header className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <h2
                        id="home-dividends-heading"
                        className={cn(
                            'font-heading font-semibold text-text-primary tracking-tight',
                            isAside ? 'text-lg' : 'text-base font-bold'
                        )}
                    >
                        {t('dividends.title')}
                    </h2>
                    <LocaleLink href="/dividends" className="text-xs font-medium text-accent hover:underline shrink-0">
                        {t('filings.viewAll')}
                    </LocaleLink>
                </div>
                <p className="text-xs text-text-tertiary font-data leading-snug">
                    {t('dividends.panelSubtitle')}
                </p>
            </header>

            <DividendSubBlock title={t('dividends.recentCalendars')}>
                {recentItems.length ? (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {recentItems.map((entry) => (
                            <DividendRow key={`${entry.stockCode}-${entry.filedAt}-${entry.url}`} entry={entry} />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-text-tertiary px-1">
                        {t('dividends.noInFeed')}
                    </p>
                )}
            </DividendSubBlock>

            {upcomingItems.length > 0 && (
                <DividendSubBlock title={t('dividends.upcomingExDates')}>
                    <p className="text-xs text-text-tertiary font-data mb-1.5">
                        {t('dividends.upcomingExHint')}
                    </p>
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {upcomingItems.map((entry) => (
                            <DividendRow key={`up-${entry.stockCode}-${entry.exDate}`} entry={entry} />
                        ))}
                    </div>
                </DividendSubBlock>
            )}
        </section>
    )
}

function DividendSubBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-semibold font-heading text-text-primary">{title}</h3>
            {children}
        </div>
    )
}
