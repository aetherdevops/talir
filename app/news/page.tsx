import { getLatestNews, getNewsFeedMeta } from '@/lib/data'
import { NewsFeedPage } from '@/components/news/NewsFeedPage'
import { FILINGS_SECTION_SUBTITLE, FILINGS_SECTION_TITLE } from '@/lib/news-style'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Filings & Disclosures | Talir',
    description: 'Regulatory filings and disclosures from companies listed on the Macedonian Stock Exchange',
}

export const revalidate = 86400

export default async function NewsPage() {
    const [news, meta] = await Promise.all([
        getLatestNews(100),
        Promise.resolve(getNewsFeedMeta()),
    ])

    return (
        <main className="max-w-7xl mx-auto min-w-0 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold font-heading text-text-primary tracking-tight">
                        {FILINGS_SECTION_TITLE}
                    </h1>
                    <p className="text-text-secondary text-sm">
                        {FILINGS_SECTION_SUBTITLE}
                    </p>
                </header>

                <NewsFeedPage items={news} lastIssuerScan={meta.lastIssuerScan} />
            </div>
        </main>
    )
}
