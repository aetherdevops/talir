
import { MarketsClient } from './client'
import { getAllInstruments, getMarketSentiment, getMarketDataAsOf, getMarketSparklines } from '@/lib/data'
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

    return (
        <main className="max-w-7xl mx-auto animate-in fade-in duration-500">
            <Suspense fallback={<MarketsLoadingSkeleton />}>
                <MarketsClient
                    initialStocks={stocks}
                    sentiment={sentiment}
                    asOfDate={asOfDate}
                    sparklines={sparklines}
                />
            </Suspense>
        </main>
    )
}
