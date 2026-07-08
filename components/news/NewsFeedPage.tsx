'use client'

import { useMemo, useState } from 'react'
import type { NewsCategory, NewsItem } from '@/lib/types'
import { NewsCard } from '@/components/news/NewsCard'
import { FilingIndicatorLegend } from '@/components/news/FilingIndicatorLegend'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn, formatAsOfDate } from '@/lib/utils'

type ScopeTab = 'all' | 'companies'
type CategoryFilter = 'all' | NewsCategory

interface NewsFeedPageProps {
    items: NewsItem[]
    lastIssuerScan: string | null
}

export function NewsFeedPage({ items, lastIssuerScan }: NewsFeedPageProps) {
    const { t } = useLocale()
    const [scope, setScope] = useState<ScopeTab>('all')
    const [category, setCategory] = useState<CategoryFilter>('all')

    const categoryFilters = useMemo(
        () =>
            [
                { id: 'all' as const, label: t('filings.allCategories') },
                { id: 'earnings' as const, label: t('filings.categoryEarnings') },
                { id: 'financials' as const, label: t('filings.categoryFinancials') },
                { id: 'dividend' as const, label: t('filings.categoryDividend') },
                { id: 'corporate' as const, label: t('filings.categoryCorporate') },
                { id: 'other' as const, label: t('filings.categoryOther') },
            ] satisfies { id: CategoryFilter; label: string }[],
        [t]
    )

    const filtered = useMemo(() => {
        return items.filter((item) => {
            if (category !== 'all' && item.category !== category) return false
            if (scope === 'companies' && !item.stockCode) return false
            return true
        })
    }, [items, scope, category])

    if (!items.length) {
        return (
            <div className="rounded-xl border border-dashed border-border bg-surface-secondary/30 px-6 py-12 text-center">
                <p className="text-sm text-text-secondary">{t('filings.noDatedFeed')}</p>
                {lastIssuerScan && (
                    <p className="mt-2 text-xs text-text-tertiary font-data">
                        {t('filings.lastIssuerScan', { date: formatAsOfDate(lastIssuerScan) })}
                    </p>
                )}
            </div>
        )
    }

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                {([
                    { id: 'all' as const, label: t('filings.scopeAll') },
                    { id: 'companies' as const, label: t('filings.scopeCompanies') },
                ]).map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => setScope(tab.id)}
                        className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium border transition-colors min-h-[44px]',
                            scope === tab.id
                                ? 'bg-accent-muted text-accent border-accent/30'
                                : 'bg-surface border-border text-text-secondary hover:bg-surface-secondary'
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="flex flex-wrap gap-2">
                {categoryFilters.map((chip) => (
                    <button
                        key={chip.id}
                        type="button"
                        onClick={() => setCategory(chip.id)}
                        className={cn(
                            'px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors min-h-[44px]',
                            category === chip.id
                                ? 'bg-surface-secondary text-text-primary border-border-active'
                                : 'bg-surface text-text-tertiary border-border hover:text-text-secondary'
                        )}
                    >
                        {chip.label}
                    </button>
                ))}
            </div>

            {filtered.length === 0 ? (
                <p className="text-sm text-text-tertiary py-8 text-center">{t('filings.noFilterMatch')}</p>
            ) : (
                <div className="space-y-2 min-w-0">
                    {filtered.map((item) => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
            )}

            <FilingIndicatorLegend stacked className="pt-3" />

            {lastIssuerScan && (
                <p className="text-xs text-text-tertiary font-data">
                    {t('filings.lastIssuerScan', { date: formatAsOfDate(lastIssuerScan) })}
                </p>
            )}
        </div>
    )
}
