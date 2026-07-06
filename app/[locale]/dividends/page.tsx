import { Suspense } from 'react'
import { Metadata } from 'next'
import {
    getAllInstruments,
    getDividendsCalendar,
    getFirstTradeDateByCode,
    getMarketDataAsOf,
} from '@/lib/data'
import { DividendsPageClient } from './client'

export const metadata: Metadata = {
    title: 'Dividends | Talir',
    description: 'SECNet dividend calendars, payout history, and market leaderboards for the Macedonian Stock Exchange',
}

export const revalidate = 86400

export default async function DividendsPage() {
    const calendar = getDividendsCalendar()
    const [stocks, firstTradeByCode] = await Promise.all([
        getAllInstruments(),
        getFirstTradeDateByCode(Object.keys(calendar.byIssuer)),
    ])
    const asOfDate = getMarketDataAsOf(stocks)

    const priceByCode: Record<string, number> = {}
    for (const stock of stocks) {
        if (stock.type !== 'Index' && stock.price > 0) {
            priceByCode[stock.code] = stock.price
        }
    }

    return (
        <main className="max-w-7xl mx-auto min-w-0 animate-in fade-in duration-500 px-1">
            <Suspense fallback={<div className="h-96 animate-pulse rounded-xl bg-surface-secondary/40" />}>
                <DividendsPageClient
                    calendar={calendar}
                    asOfDate={asOfDate}
                    priceByCode={priceByCode}
                    firstTradeByCode={firstTradeByCode}
                />
            </Suspense>
        </main>
    )
}
