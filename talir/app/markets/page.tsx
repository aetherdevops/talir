
import { MarketsClient } from './client'
import { getAllInstruments } from '@/lib/data'
import { Suspense } from 'react'
import { MarketsLoadingSkeleton } from './loading-skeleton'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'Markets | Talir',
    description: 'Explore all stocks on the Macedonian Stock Exchange',
}

export default async function MarketsPage() {
    const stocks = await getAllInstruments()

    return (
        <div className="min-h-screen bg-background pb-20">
            <main className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-8">
                    <Suspense fallback={<MarketsLoadingSkeleton />}>
                        <MarketsClient initialStocks={stocks} />
                    </Suspense>
                </div>
            </main>
        </div>
    )
}
