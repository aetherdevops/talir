"use client"

import { usePortfolioStore } from "@/lib/stores/portfolio"
import { formatPrice, formatInteger, cn } from "@/lib/utils"
import { ChangeLabel } from "@/components/ui/ChangeLabel"
import { PieChart } from "lucide-react"
import { Card, CardContent } from "@/components/ui/Card"
import { ResponsiveText } from "@/components/ui/ResponsiveText"

interface PortfolioHoldingIndicatorProps {
    stockCode: string
    currentPrice: number
}

export function PortfolioHoldingIndicator({ stockCode, currentPrice }: PortfolioHoldingIndicatorProps) {
    const { portfolios } = usePortfolioStore()

    const stats = portfolios.reduce((acc, portfolio) => {
        const holdings = portfolio.holdings.filter(h => h.code === stockCode)
        if (holdings.length === 0) return acc

        holdings.forEach(h => {
            acc.quantity += h.quantity
            acc.costBasis += h.quantity * h.buyPrice
            acc.marketValue += h.quantity * currentPrice
        })
        acc.hasHolding = true
        return acc
    }, {
        quantity: 0,
        costBasis: 0,
        marketValue: 0,
        hasHolding: false
    })

    if (!stats.hasHolding) return null

    const totalPortfolioValue = portfolios.reduce((acc, p) => {
        return acc + p.holdings.reduce((pAcc, h) => {
            const price = h.code === stockCode ? currentPrice : h.buyPrice
            return pAcc + (h.quantity * price)
        }, 0)
    }, 0)

    const totalGain = stats.marketValue - stats.costBasis
    const totalGainPercent = stats.costBasis > 0 ? (totalGain / stats.costBasis) * 100 : 0

    return (
        <Card className="animate-fade-in overflow-hidden">
            <CardContent className="p-5">
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-brand-500/10 p-2.5 rounded-full text-brand-500 flex-shrink-0">
                        <PieChart className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="font-bold text-text-primary text-sm uppercase tracking-wider">In your portfolio</h3>
                        <p className="text-xs text-text-secondary mt-0.5">
                            You own <span className="font-bold text-text-primary">{formatInteger(stats.quantity)}</span> shares
                        </p>
                    </div>
                </div>

                <div className="mb-1">
                    <ResponsiveText baseSize="text-2xl" className="font-bold font-mono tracking-tight text-text-primary">
                        {formatPrice(stats.marketValue)}
                    </ResponsiveText>
                </div>

                {totalPortfolioValue > 0 && (
                    <div className="text-xs font-medium text-text-tertiary mb-4">
                        {((stats.marketValue / totalPortfolioValue) * 100).toFixed(1)}% of your portfolios
                    </div>
                )}

                <div className="h-px bg-border my-3" />

                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 font-mono font-medium text-sm">
                        <span className={cn(totalGain >= 0 ? 'text-up' : 'text-down')}>
                            {formatPrice(totalGain)}
                        </span>
                        <ChangeLabel change={totalGainPercent} className="text-xs" />
                    </div>
                    <div className="text-[10px] font-bold text-text-tertiary uppercase tracking-wider text-right flex-shrink-0">
                        Total Return
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
