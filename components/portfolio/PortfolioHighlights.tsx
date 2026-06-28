
import { ArrowUpRight, ArrowDownRight, PieChart, Building2, Wallet } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'

interface PortfolioHighlightsProps {
    dailyGain: number
    dailyGainPercent: number
    totalGain: number
    totalGainPercent: number
    className?: string
}

export function PortfolioHighlights({
    dailyGain,
    dailyGainPercent,
    totalGain,
    totalGainPercent,
    className
}: PortfolioHighlightsProps) {
    return (
        <div className={cn("bg-surface rounded-3xl p-6 border border-border h-full", className)}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text-primary">Portfolio highlights</h3>
            </div>

            <div className="flex flex-col gap-4 mb-8">
                <div>
                    <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Day Gain</div>
                    <div className={cn(
                        "flex flex-col p-3 rounded-xl",
                        dailyGain >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}>
                        <div className="text-lg font-bold font-mono tracking-tight">
                            {dailyGain > 0 ? '+' : ''}{formatPrice(dailyGain)}
                        </div>
                        <div className="text-sm font-medium font-mono flex items-center gap-1">
                            {dailyGain >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(dailyGainPercent).toFixed(2)}%
                        </div>
                    </div>
                </div>
                <div>
                    <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Total Gain</div>
                    <div className={cn(
                        "flex flex-col p-3 rounded-xl",
                        totalGain >= 0 ? "bg-success/10 text-success" : "bg-danger/10 text-danger"
                    )}>
                        <div className="text-lg font-bold font-mono tracking-tight">
                            {totalGain > 0 ? '+' : ''}{formatPrice(totalGain)}
                        </div>
                        <div className="text-sm font-medium font-mono flex items-center gap-1">
                            {totalGain >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                            {Math.abs(totalGainPercent).toFixed(2)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Placeholder list items restricted by user request, keeping it clean or adding allowed stats if any */}
            {/* User explicitly asked to remove the specific stats (100% stocks etc). */}
            {/* We will leave this area empty or add general info if needed, for now just the gains as requested structure. */}
        </div>
    )
}
