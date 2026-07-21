'use client'

import { useLocale } from '@/components/providers/LocaleProvider'
import type { MacroNewsItem } from '@/lib/macro'
import { formatNewsDate } from '@/lib/utils'

interface MacroNewsListProps {
    news: MacroNewsItem[]
}

export function MacroNewsList({ news }: MacroNewsListProps) {
    const { t, locale } = useLocale()

    const sorted = [...news].sort((a, b) => b.date.localeCompare(a.date))

    return (
        <section className="space-y-3 min-w-0" aria-labelledby="macro-news">
            <div className="space-y-1">
                <h2
                    id="macro-news"
                    className="text-lg font-heading font-semibold text-text-primary tracking-tight"
                >
                    {t('macro.newsTitle')}
                </h2>
                <p className="text-sm text-text-secondary">{t('macro.newsSubtitle')}</p>
            </div>

            <ul className="rounded-xl border border-border bg-surface divide-y divide-border">
                {sorted.map((item) => {
                    const title = locale === 'mk' ? item.titleMk : item.titleEn
                    return (
                        <li key={item.id} className="px-4 py-3 flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-4">
                            <time
                                dateTime={item.date}
                                className="shrink-0 font-data text-[11px] tabular-nums text-text-tertiary"
                            >
                                {formatNewsDate(item.date)}
                            </time>
                            <span className="text-sm font-sans text-text-primary leading-snug">{title}</span>
                        </li>
                    )
                })}
            </ul>
        </section>
    )
}
