import Link from 'next/link'
import { StockSummary } from '@/lib/types'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { IndexSparkline } from '@/components/home/IndexSparkline'
import { formatPriceCompact } from '@/lib/utils'
import { cn } from '@/lib/utils'

interface HomeTopMoversProps {
    gainers: StockSummary[]
    losers: StockSummary[]
    className?: string
}

function MoverRow({ stock }: { stock: StockSummary }) {
    const series = stock.chartSeries ?? []
    const positive = stock.changePercent >= 0

    return (
        <Link
            href={`/stock/${stock.code}`}
            className="flex items-center gap-2 min-h-[44px] py-2 px-1 hover:bg-surface-secondary/60 rounded-lg transition-colors"
        >
            <span className="text-xs font-bold text-text-secondary w-11 shrink-0 tabular-nums">
                {stock.code}
            </span>
            <div className="w-[56px] h-6 shrink-0">
                <IndexSparkline series={series} positive={positive} height={24} className="w-full" />
            </div>
            <span className="text-xs font-semibold text-text-primary tabular-nums ml-auto">
                {formatPriceCompact(stock.price)}
            </span>
            <div className="w-[68px] flex justify-end shrink-0">
                <ChangeLabel change={stock.changePercent} className="text-[11px]" />
            </div>
        </Link>
    )
}

function MoverColumn({ title, stocks, emptyLabel }: { title: string; stocks: StockSummary[]; emptyLabel: string }) {
    return (
        <div className="rounded-xl border border-border/60 bg-surface/50 p-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-text-tertiary mb-2 px-1">
                {title}
            </h3>
            {stocks.length > 0 ? (
                <div className="divide-y divide-border/40">
                    {stocks.map((s) => (
                        <MoverRow key={s.code} stock={s} />
                    ))}
                </div>
            ) : (
                <p className="text-xs text-text-tertiary px-1 py-4">{emptyLabel}</p>
            )}
        </div>
    )
}

export function HomeTopMovers({ gainers, losers, className }: HomeTopMoversProps) {
    return (
        <section className={cn('grid grid-cols-1 md:grid-cols-2 gap-3', className)}>
            <MoverColumn title="Top Gainers" stocks={gainers} emptyLabel="No gainers today" />
            <MoverColumn title="Top Losers" stocks={losers} emptyLabel="No losers today" />
        </section>
    )
}
