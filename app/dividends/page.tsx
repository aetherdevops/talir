import { Suspense } from 'react'
import { Metadata } from 'next'
import {
    getAllInstruments,
    getDividendsCalendar,
    getMarketDataAsOf,
} from '@/lib/data'
import { DividendsPageClient } from './client'

export const metadata: Metadata = {
    title: 'Dividends | Talir',
    description: 'SECNet dividend calendars, payout history, and market leaderboards for the Macedonian Stock Exchange',
}

export const revalidate = 86400

export default async function DividendsPage() {
    const [calendar, stocks] = await Promise.all([Promise.resolve(getDividendsCalendar()), getAllInstruments()])
    const asOfDate = getMarketDataAsOf(stocks)

    return (
        <main className="max-w-7xl mx-auto min-w-0 animate-in fade-in duration-500 px-1">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface-secondary/40" />}>
                <DividendsPageClient calendar={calendar} asOfDate={asOfDate} />
            </Suspense>
        </main>
    )
}
