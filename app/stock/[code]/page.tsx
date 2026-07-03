import { notFound } from 'next/navigation'
import { getStock, getChartData, getLatestNews, getAllStocks } from '@/lib/data'
import { StockClient } from './StockClient'

export const revalidate = 86400

export async function generateStaticParams() {
    const stocks = await getAllStocks()
    return stocks.map((stock) => ({ code: stock.code }))
}

export default async function StockPage({ params }: { params: Promise<{ code: string }> }) {
    const resolvedParams = await params
    const code = resolvedParams.code

    // Check if code is valid/exists
    if (!code) {
        notFound()
    }

    const stock = await getStock(code)

    if (!stock) {
        notFound()
    }

    const news = await getLatestNews(10, code)

    const { history } = stock
    // JSON history is Oldest -> Newest (ASC), so latest is the last item
    const latest = history[history.length - 1] || {}
    const chartData = getChartData(history, 2000) // Ensure we have ample data for MAX/5Y

    // Current Price for client
    const currentPrice = latest.last_transaction_price || 0
    const asOfDate = latest.date || new Date().toISOString().split('T')[0]

    return (
        <StockClient
            stock={stock}
            history={history}
            chartData={chartData}
            currentPrice={currentPrice}
            news={news}
            asOfDate={asOfDate}
        />
    )
}
