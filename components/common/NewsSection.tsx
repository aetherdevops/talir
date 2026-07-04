import type { NewsItem } from '@/lib/types'
import { NewsFeed } from '@/components/news/NewsFeed'

import { FILINGS_SECTION_TITLE } from '@/lib/news-style'

interface NewsSectionProps {
    items: NewsItem[]
    title?: string
}

export function NewsSection({ items, title = FILINGS_SECTION_TITLE }: NewsSectionProps) {
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
