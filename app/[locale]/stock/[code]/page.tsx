import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import {
    getStock,
    getChartData,
    getCompanyFilings,
    getResultsForIssuer,
    getExpectedForIssuer,
    getDividendsForIssuer,
    getFundamentalsForIssuer,
    getRelatedStocksBySector,
} from '@/lib/data'
import { StockClient } from './StockClient'

export const revalidate = 86400

export async function generateStaticParams() {
    const { getAllStocks } = await import('@/lib/data')
    const stocks = await getAllStocks()
    const locales = ['mk', 'en'] as const
    return locales.flatMap((locale) => stocks.map((stock) => ({ locale, code: stock.code })))
}

function StockPageFallback() {
    return (
        <div className="w-full max-w-[1200px] mx-auto min-h-[400px] animate-pulse rounded-xl bg-surface border border-border" />
    )
}

export default async function StockPage({ params }: { params: Promise<{ code: string }> }) {
    const resolvedParams = await params
    const code = resolvedParams.code

    if (!code) {
        notFound()
    }

    const stock = await getStock(code)

    if (!stock) {
        notFound()
    }

    const { dated, undated } = getCompanyFilings(code)
    const issuerResults = getResultsForIssuer(code)
    const issuerExpected = getExpectedForIssuer(code)
    const issuerDividends = getDividendsForIssuer(code)
    const issuerFundamentals = getFundamentalsForIssuer(code)
    const relatedStocks = await getRelatedStocksBySector(code, stock.sector, 4)

    const { history } = stock
    const latest = history[history.length - 1] || {}
    const chartData = getChartData(history, 2000)
    const currentPrice = latest.last_transaction_price || 0
    const asOfDate = latest.date || new Date().toISOString().split('T')[0]

    return (
        <Suspense fallback={<StockPageFallback />}>
            <StockClient
                stock={stock}
                history={history}
                chartData={chartData}
                currentPrice={currentPrice}
                filingsDated={dated}
                filingsUndated={undated}
                issuerResults={issuerResults}
                issuerExpected={issuerExpected}
                issuerDividends={issuerDividends}
                issuerFundamentals={issuerFundamentals}
                relatedStocks={relatedStocks}
                asOfDate={asOfDate}
            />
        </Suspense>
    )
}
