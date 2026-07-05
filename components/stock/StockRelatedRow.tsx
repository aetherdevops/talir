'use client'

import Link from 'next/link'
import type { StockSummary } from '@/lib/types'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { formatPrice } from '@/lib/utils'

interface StockRelatedRowProps {
    stocks: StockSummary[]
    sector: string
}

export function StockRelatedRow({ stocks, sector }: StockRelatedRowProps) {
    if (!stocks.length) return null

    return (
        <section aria-labelledby="related-stocks-heading" className="space-y-3">
            <h2 id="related-stocks-heading" className="text-sm font-semibold text-text-primary">
                Related stocks
            </h2>
            <p className="text-xs text-text-secondary font-data">{sector} · by turnover</p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 md:grid md:grid-cols-4 md:overflow-visible">
                {stocks.map((stock) => (
                    <Link
                        key={stock.code}
                        href={`/stock/${stock.code}`}
                        className="flex flex-col gap-1 min-w-[140px] md:min-w-0 rounded-xl border border-border bg-surface p-3 hover:bg-surface-secondary transition-colors min-h-[44px]"
                    >
                        <span className="font-data text-xs font-semibold text-accent tabular-nums">{stock.code}</span>
                        <span className="text-xs text-text-secondary truncate leading-snug">{stock.name}</span>
                        <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="font-data text-sm font-semibold text-text-primary tabular-nums">
                                {formatPrice(stock.price)}
                            </span>
                            <ChangeLabel change={stock.changePercent} className="text-xs" />
                        </div>
                    </Link>
                ))}
            </div>
        </section>
    )
}
