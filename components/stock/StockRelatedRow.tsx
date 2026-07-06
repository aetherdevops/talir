'use client'

import { LocaleLink } from '@/components/layout/LocaleLink'
import type { StockSummary } from '@/lib/types'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { IssuerDisplayName } from '@/components/common/IssuerDisplayName'
import { useLocale } from '@/components/providers/LocaleProvider'
import { translateSector } from '@/lib/sectors'
import { formatPrice } from '@/lib/utils'

interface StockRelatedRowProps {
    stocks: StockSummary[]
    sector: string
}

export function StockRelatedRow({ stocks, sector }: StockRelatedRowProps) {
    const { t } = useLocale()

    if (!stocks.length) return null

    return (
        <section aria-labelledby="related-stocks-heading" className="space-y-3">
            <h2 id="related-stocks-heading" className="text-sm font-semibold text-text-primary">
                {t('stock.relatedStocks')}
            </h2>
            <p className="text-xs text-text-secondary font-data">
                {translateSector(sector, t)} · {t('stock.relatedByCap')}
            </p>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1 md:grid md:grid-cols-4 md:overflow-visible">
                {stocks.map((stock) => (
                    <LocaleLink
                        key={stock.code}
                        href={`/stock/${stock.code}`}
                        className="flex flex-col gap-1 min-w-[140px] md:min-w-0 rounded-xl border border-border bg-surface p-3 hover:bg-surface-secondary transition-colors min-h-[44px]"
                    >
                        <span className="font-data text-xs font-semibold text-accent tabular-nums">{stock.code}</span>
                        <IssuerDisplayName
                            code={stock.code}
                            name={stock.name}
                            className="text-xs text-text-secondary truncate leading-snug"
                        />
                        <div className="flex items-center justify-between gap-2 mt-1">
                            <span className="font-data text-sm font-semibold text-text-primary tabular-nums">
                                {formatPrice(stock.price)}
                            </span>
                            <ChangeLabel change={stock.changePercent} className="text-xs" />
                        </div>
                    </LocaleLink>
                ))}
            </div>
        </section>
    )
}
