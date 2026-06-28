import { notFound } from 'next/navigation'
import { getStock, getChartData } from '@/lib/data'
import { StockClient } from './StockClient'

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

    const { history } = stock
    // JSON history is Oldest -> Newest (ASC), so latest is the last item
    const latest = history[history.length - 1] || {}
    const chartData = getChartData(history, 2000) // Ensure we have ample data for MAX/5Y

    // Current Price for client
    const currentPrice = latest.last_transaction_price || 0

    return (
        <StockClient
            stock={stock}
            history={history}
            chartData={chartData}
            currentPrice={currentPrice}
        />
    )
}
