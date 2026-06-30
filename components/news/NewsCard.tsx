import { ExternalLink } from 'lucide-react'
import type { NewsItem } from '@/lib/types'
import { NEWS_CATEGORY_LABELS } from '@/lib/news'
import { formatTimeAgo } from '@/lib/time'
import { NewsThumbnail } from '@/components/news/NewsThumbnail'

interface NewsCardProps {
    item: NewsItem
    variant?: 'featured' | 'compact' | 'list'
}

export function NewsCard({ item, variant = 'compact' }: NewsCardProps) {
    const categoryLabel = NEWS_CATEGORY_LABELS[item.category]

    if (variant === 'featured') {
        return (
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group block rounded-xl border border-border bg-surface overflow-hidden hover:border-border-active transition-colors"
            >
                <div className="grid md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
                    <NewsThumbnail
                        category={item.category}
                        stockCode={item.stockCode}
                        imageUrl={item.imageUrl}
                        featured
                        className="md:min-h-[200px]"
                    />
                    <div className="p-5 md:p-6 flex flex-col justify-center gap-3 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-text-tertiary">
                            <span className="font-bold text-accent">{item.stockCode}</span>
                            <span>·</span>
                            <span className="uppercase tracking-wider">{item.source}</span>
                            <span>·</span>
                            <span>{formatTimeAgo(item.publishedAt)}</span>
                            <span className="rounded-full bg-accent-muted px-2 py-0.5 text-[10px] font-semibold text-accent">
                                {categoryLabel}
                            </span>
                        </div>
                        <h3 className="text-lg md:text-xl font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors line-clamp-3">
                            {item.title}
                        </h3>
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-text-secondary group-hover:text-accent">
                            Read filing <ExternalLink className="h-3 w-3" aria-hidden />
                        </span>
                    </div>
                </div>
            </a>
        )
    }

    if (variant === 'list') {
        return (
            <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex gap-4 rounded-xl border border-border bg-surface p-4 hover:border-border-active transition-colors"
            >
                <div className="w-28 sm:w-32 flex-shrink-0 rounded-lg overflow-hidden border border-border">
                    <NewsThumbnail
                        category={item.category}
                        stockCode={item.stockCode}
                        imageUrl={item.imageUrl}
                        className="min-h-[88px]"
                    />
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1.5">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-text-tertiary">
                        <span className="font-bold text-accent">{item.stockCode}</span>
                        <span>·</span>
                        <span>{formatTimeAgo(item.publishedAt)}</span>
                        <span className="rounded-full bg-surface-secondary px-2 py-0.5 font-semibold">
                            {categoryLabel}
                        </span>
                    </div>
                    <h3 className="font-semibold text-text-primary leading-snug group-hover:text-accent transition-colors line-clamp-2">
                        {item.title}
                    </h3>
                </div>
                <ExternalLink className="h-4 w-4 text-text-tertiary flex-shrink-0 self-center opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden />
            </a>
        )
    }

    return (
        <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="group block rounded-xl border border-border bg-surface overflow-hidden hover:border-border-active transition-colors h-full"
        >
            <NewsThumbnail
                category={item.category}
                stockCode={item.stockCode}
                imageUrl={item.imageUrl}
                className="min-h-[120px]"
            />
            <div className="p-4 space-y-2">
                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-text-tertiary">
                    <span className="font-bold text-accent">{item.stockCode}</span>
                    <span>·</span>
                    <span>{formatTimeAgo(item.publishedAt)}</span>
                </div>
                <h3 className="font-semibold text-sm text-text-primary leading-snug group-hover:text-accent transition-colors line-clamp-2">
                    {item.title}
                </h3>
            </div>
        </a>
    )
}
