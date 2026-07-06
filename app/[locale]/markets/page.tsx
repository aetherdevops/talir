
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
import { Suspense } from 'react'
import { MarketsLoadingSkeleton } from './loading-skeleton'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Markets | Talir',
    description: 'Explore all stocks on the Macedonian Stock Exchange',
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
