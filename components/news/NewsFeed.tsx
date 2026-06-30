import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { NewsItem } from '@/lib/types'
import { NewsCard } from '@/components/news/NewsCard'
import { Button } from '@/components/ui/Button'

interface NewsFeedProps {
    items: NewsItem[]
    layout?: 'home' | 'page'
    title?: string
    subtitle?: string
    showHeader?: boolean
}

export function NewsFeed({
    items,
    layout = 'home',
    title = 'MSE Market News',
    subtitle = 'Latest filings and disclosures from listed companies',
    showHeader = true,
}: NewsFeedProps) {
    if (!items.length) return null

    if (layout === 'page') {
        const [featured, ...rest] = items
        return (
            <div className="space-y-6">
                {featured && <NewsCard item={featured} variant="featured" />}
                <div className="space-y-3">
                    {rest.map((item) => (
                        <NewsCard key={item.id} item={item} variant="list" />
                    ))}
                </div>
            </div>
        )
    }

    const [featured, ...rest] = items

    return (
        <section className={cnSection()}>
            {showHeader && (
                <div className="flex items-start justify-between gap-4 px-0 sm:px-0">
                    <div>
                        <h2 className="text-2xl font-semibold text-text-primary tracking-tight">{title}</h2>
                        <p className="text-sm text-text-secondary mt-1">{subtitle}</p>
                    </div>
                    <Button variant="ghost" size="sm" asChild className="flex-shrink-0">
                        <Link href="/news" className="text-accent font-semibold flex items-center gap-1">
                            View all <ArrowRight className="h-4 w-4" />
                        </Link>
                    </Button>
                </div>
            )}

            <div className="space-y-4">
                {featured && <NewsCard item={featured} variant="featured" />}
                {rest.length > 0 && (
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                        {rest.map((item) => (
                            <NewsCard key={item.id} item={item} variant="compact" />
                        ))}
                    </div>
                )}
            </div>
        </section>
    )
}

function cnSection() {
    return 'space-y-5 pt-6 border-t border-border'
}
