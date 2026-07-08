import { Suspense } from 'react'
import type { Metadata } from 'next'
import { MarketsClient } from './client'
import {
    getAllInstruments,
    getMarketSentiment,
    getMarketDataAsOf,
    getMarketSparklines,
    getAllResults,
    getExpectedResults,
    getResultsCalendar,
    getAllDividends,
    getUpcomingExDates,
    getNewsFeedMeta,
    getMarketBreadth,
} from '@/lib/data'
import { MarketsLoadingSkeleton } from './loading-skeleton'
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
        title: `${translate(messages, 'markets.title')} | ${translate(messages, 'brand.wordmark')}`,
        description: translate(messages, 'markets.subtitle'),
    }
}

export const revalidate = 86400

export default async function MarketsPage() {
    const stocks = await getAllInstruments()
    const sentiment = getMarketSentiment(stocks)
    const asOfDate = getMarketDataAsOf(stocks)
    const sparklines = getMarketSparklines()
    const results = getAllResults()
    const expected = getExpectedResults()
    const dividends = getAllDividends()
    const upcomingExDates = getUpcomingExDates()
    const resultsCalendar = getResultsCalendar()
    const newsMeta = getNewsFeedMeta()
    const breadth = getMarketBreadth()

    return (
        <main className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <Suspense fallback={<MarketsLoadingSkeleton />}>
                <MarketsClient
                    initialStocks={stocks}
                    sentiment={sentiment}
                    asOfDate={asOfDate}
                    sparklines={sparklines}
                    results={results}
                    expected={expected}
                    dividends={dividends}
                    upcomingExDates={upcomingExDates}
                    lastIssuerScan={newsMeta.lastIssuerScan ?? resultsCalendar.lastIssuerScan}
                    issuerCount={resultsCalendar.issuerCount}
                    high52wCodes={breadth?.high52wCodes ?? []}
                    low52wCodes={breadth?.low52wCodes ?? []}
                />
            </Suspense>
        </main>
    )
}
