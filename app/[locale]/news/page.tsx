import { getLatestNews, getNewsFeedMeta } from '@/lib/data'
import { NewsFeedPage } from '@/components/news/NewsFeedPage'
import type { Metadata } from 'next'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary, translate } from '@/lib/i18n/get-dictionary'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale: raw } = await params
    const locale = isLocale(raw) ? raw : 'mk'
    const messages = getDictionary(locale)

    return {
        title: `${translate(messages, 'filings.updates')} | ${translate(messages, 'brand.wordmark')}`,
        description: translate(messages, 'filings.hubDescription'),
    }
}

export const revalidate = 86400

export default async function NewsPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale: raw } = await params
    const locale = isLocale(raw) ? raw : 'mk'
    const messages = getDictionary(locale)

    const [news, meta] = await Promise.all([
        getLatestNews(100),
        Promise.resolve(getNewsFeedMeta()),
    ])

    return (
        <main className="max-w-7xl mx-auto min-w-0 animate-in fade-in duration-500">
            <div className="flex flex-col gap-6">
                <header className="flex flex-col gap-2">
                    <h1 className="text-2xl sm:text-3xl font-semibold font-heading text-text-primary tracking-tight">
                        {translate(messages, 'filings.updates')}
                    </h1>
                    <p className="text-text-secondary text-sm">
                        {translate(messages, 'filings.hubDescription')}
                    </p>
                </header>

                <NewsFeedPage items={news} lastIssuerScan={meta.lastIssuerScan} />
            </div>
        </main>
    )
}
