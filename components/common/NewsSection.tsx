import type { NewsItem } from '@/lib/types'
import { NewsFeed } from '@/components/news/NewsFeed'

interface NewsSectionProps {
    items: NewsItem[]
    title?: string
}

export function NewsSection({ items, title = 'In the news' }: NewsSectionProps) {
    if (!items.length) return null

    return (
        <NewsFeed
            items={items}
            layout="page"
            title={title}
            showHeader={!!title}
        />
    )
}
