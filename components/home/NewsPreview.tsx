import type { NewsItem } from '@/lib/types'
import { NewsFeed } from '@/components/news/NewsFeed'

interface NewsPreviewProps {
    news: NewsItem[]
}

/** @deprecated Use NewsFeed directly */
export function NewsPreview({ news }: NewsPreviewProps) {
    return <NewsFeed items={news} layout="home" />
}
