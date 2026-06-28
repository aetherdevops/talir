
"use client"

import { useMemo } from 'react'
import { PriceChart } from "@/components/charts/PriceChart"

interface PortfolioChartProps {
    holdings: {
        code: string
        quantity: number
        buyDate: string
        marketValue: number
    }[]
}

// Helper to generate mock historical data based on current value and some volatility
// In a real app, we would fetch historical prices for each holding and sum them up correctly.
function generateMockHistory(currentValue: number, volatility: number = 0.02) {
    if (currentValue === 0) return []

    const data = []
    const now = new Date()
    let value = currentValue

    // Generate 365 days of history backwards
    for (let i = 0; i < 365; i++) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)

        // Random walk
        const change = 1 + (Math.random() * volatility * 2 - volatility)
        value = value / change // Reverse calc since we start from current

        // Don't go below 0
        if (value < 0) value = 0

        data.push({
            time: date.toISOString().split('T')[0],
            value: value
        })
    }

    // Reverse to be chronological
    return data.reverse()
}

export function PortfolioChart({ holdings }: PortfolioChartProps) {
    const totalValue = holdings.reduce((sum, h) => sum + h.marketValue, 0)

    const chartData = useMemo(() => {
        return generateMockHistory(totalValue)
    }, [totalValue])

    if (totalValue === 0) return null

    return (
        <div className="w-full h-[350px] md:h-[400px]">
            <PriceChart data={chartData} />
        </div>
    )
}
