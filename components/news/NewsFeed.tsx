'use client'

import { ArrowRight } from 'lucide-react'
import type { NewsItem } from '@/lib/types'
import { NewsCard } from '@/components/news/NewsCard'
import { FilingIndicatorLegend } from '@/components/news/FilingIndicatorLegend'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

interface NewsFeedProps {
    items: NewsItem[]
    layout?: 'home' | 'home-rail' | 'page'
    title?: string
    subtitle?: string
    showHeader?: boolean
    showLegend?: boolean
}

export function NewsFeed({
    items,
    layout = 'home',
    title,
    subtitle,
    showHeader = true,
    showLegend = true,
}: NewsFeedProps) {
    const { t } = useLocale()
    const resolvedTitle = title ?? t('filings.updates')
    const resolvedSubtitle = subtitle ?? t('filings.hubDescription')

    if (!items.length) return null

    if (layout === 'page') {
        return (
            <section className="space-y-3 min-w-0" aria-labelledby={showHeader ? 'updates-section-heading' : undefined}>
                {showHeader && (
                    <h2 id="updates-section-heading" className="font-heading text-lg font-semibold text-text-primary">
                        {resolvedTitle}
                    </h2>
                )}
                <div className="space-y-2 min-w-0">
                    {items.map((item) => (
                        <NewsCard key={item.id} item={item} />
                    ))}
                </div>
                {showLegend && <FilingIndicatorLegend stacked className="pt-2" />}
            </section>
        )
    }

    const isRail = layout === 'home-rail'

    return (
        <section
            className={cn('min-w-0', isRail ? 'space-y-3 sticky top-4' : 'space-y-5 pt-6')}
            aria-labelledby={showHeader ? 'updates-section-heading' : undefined}
        >
            {showHeader && (
                <div className={cn('min-w-0', isRail ? 'space-y-1' : undefined)}>
                    <div className="flex items-start justify-between gap-2 min-w-0">
                        <div className="min-w-0">
                            <h2
                                id="updates-section-heading"
                                className={cn(
                                    'font-heading font-semibold text-text-primary tracking-tight',
                                    isRail ? 'text-lg' : 'text-2xl'
                                )}
                            >
                                {resolvedTitle}
                            </h2>
                            {!isRail && (
                                <p className="text-sm text-text-secondary mt-1">{resolvedSubtitle}</p>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            asChild
                            className={cn('flex-shrink-0', isRail ? 'h-8 px-2' : undefined)}
                        >
                            <LocaleLink
                                href="/news"
                                className={cn(
                                    'text-accent font-semibold flex items-center gap-0.5',
                                    isRail ? 'text-xs gap-0.5' : 'gap-1'
                                )}
                            >
                                {isRail ? t('filings.viewAll') : t('common.viewAll')}
                                <ArrowRight className={isRail ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
                            </LocaleLink>
                        </Button>
                    </div>
                    {isRail && (
                        <p className="text-xs text-text-secondary leading-snug">{resolvedSubtitle}</p>
                    )}
                </div>
            )}

            <div className={cn('min-w-0', isRail ? 'space-y-2' : 'space-y-2')}>
                {items.map((item) => (
                    <NewsCard key={item.id} item={item} />
                ))}
            </div>

            {showLegend && (
                <FilingIndicatorLegend stacked={isRail} className="pt-2" />
            )}
        </section>
    )
}
