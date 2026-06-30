
import { MarketsClient } from './client'
import { getAllInstruments, getMarketSentiment, getMarketDataAsOf } from '@/lib/data'
import { Suspense } from 'react'
import { MarketsLoadingSkeleton } from './loading-skeleton'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Markets | Talir',
    description: 'Explore all stocks on the Macedonian Stock Exchange',
}

export const revalidate = 60

export default async function MarketsPage() {
    const stocks = await getAllInstruments()
    const sentiment = getMarketSentiment(stocks)
    const asOfDate = getMarketDataAsOf(stocks)

    return (
        <div className="min-h-screen bg-background pb-20">
            <main className="max-w-4xl mx-auto px-4 py-8 animate-in fade-in duration-500">
                <Suspense fallback={<MarketsLoadingSkeleton />}>
                    <MarketsClient
                        initialStocks={stocks}
                        sentiment={sentiment}
                        asOfDate={asOfDate}
                    />
                </Suspense>
            </main>
        </div>
    )
}
