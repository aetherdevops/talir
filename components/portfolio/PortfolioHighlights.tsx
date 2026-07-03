
import { cn, formatPrice, classifyChangePercent } from '@/lib/utils'
import { ChangeLabel } from '@/components/ui/ChangeLabel'

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
    const dailyDir = classifyChangePercent(dailyGainPercent)
    const totalDir = classifyChangePercent(totalGainPercent)

    return (
        <div className={cn("bg-surface rounded-3xl p-6 border border-border h-full", className)}>
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-text-primary font-heading">Portfolio highlights</h3>
            </div>

            <div className="flex flex-col gap-4 mb-8">
                <div>
                    <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Day Gain</div>
                    <div className={cn(
                        "flex flex-col p-3 rounded-xl",
                        dailyDir === 'up' ? "bg-up/10" : dailyDir === 'down' ? "bg-down/10" : "bg-surface-tertiary/50"
                    )}>
                        <div className={cn(
                            "text-lg font-bold font-mono tracking-tight",
                            dailyDir === 'up' ? 'text-up' : dailyDir === 'down' ? 'text-down' : 'text-neutral'
                        )}>
                            {dailyGain > 0 ? '+' : ''}{formatPrice(dailyGain)}
                        </div>
                        <ChangeLabel change={dailyGainPercent} className="text-sm" />
                    </div>
                </div>
                <div>
                    <div className="text-xs font-bold text-text-tertiary uppercase tracking-wider mb-2">Total Gain</div>
                    <div className={cn(
                        "flex flex-col p-3 rounded-xl",
                        totalDir === 'up' ? "bg-up/10" : totalDir === 'down' ? "bg-down/10" : "bg-surface-tertiary/50"
                    )}>
                        <div className={cn(
                            "text-lg font-bold font-mono tracking-tight",
                            totalDir === 'up' ? 'text-up' : totalDir === 'down' ? 'text-down' : 'text-neutral'
                        )}>
                            {totalGain > 0 ? '+' : ''}{formatPrice(totalGain)}
                        </div>
                        <ChangeLabel change={totalGainPercent} className="text-sm" />
                    </div>
                </div>
            </div>
        </div>
    )
}
