'use client'

import type { NewsCategory, NewsItem } from '@/lib/types'
import { resolveFilingTier } from '@/lib/news'
import { formatNewsDate } from '@/lib/utils'
import { FilingIndicatorDot } from '@/components/news/FilingIndicatorLegend'
import { useLocale } from '@/components/providers/LocaleProvider'

interface NewsCardProps {
    item: NewsItem
}

const CATEGORY_KEYS: Record<NewsCategory, string> = {
    earnings: 'filings.categoryEarnings',
    financials: 'filings.categoryFinancials',
    dividend: 'filings.categoryDividend',
    corporate: 'filings.categoryCorporate',
    other: 'filings.categoryOther',
}

export function NewsCard({ item }: NewsCardProps) {
    const { t } = useLocale()
    const categoryLabel = t(CATEGORY_KEYS[item.category])
    const tier = resolveFilingTier(item)
    const dateUnknownLabel = t('filings.dateUnknown')

    const dateLabel =
        item.dateKnown && item.publishedAt ? (
            <time dateTime={item.publishedAt} className="font-data font-semibold text-text-secondary tabular-nums">
                {formatNewsDate(item.publishedAt)}
            </time>
        ) : (
            <span className="font-data font-semibold text-text-tertiary">{dateUnknownLabel}</span>
        )

    const ariaLabel = [
        item.dateKnown && item.publishedAt ? formatNewsDate(item.publishedAt) : dateUnknownLabel,
        item.stockCode,
        categoryLabel,
        item.title,
    ]
        .filter(Boolean)
        .join(' · ')

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={ariaLabel}
            className="group block rounded-lg bg-surface-secondary px-3 py-2.5 hover:bg-surface-elevated transition-colors min-w-0 min-h-[44px]"
        >
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0">
                <FilingIndicatorDot tier={tier} className="self-center" />
                {dateLabel}
                {item.stockCode ? (
                    <>
                        <span className="text-text-tertiary" aria-hidden>
                            ·
                        </span>
                        <span className="font-data font-semibold text-accent tabular-nums">{item.stockCode}</span>
                    </>
                ) : null}
                <span
                    className="rounded-full bg-surface-secondary px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-text-secondary"
                >
                    {categoryLabel}
                </span>
            </div>
            <h3 className="mt-1.5 text-sm font-medium text-text-primary leading-snug line-clamp-2 group-hover:text-accent transition-colors">
                {item.title}
            </h3>
        </a>
    )
}
