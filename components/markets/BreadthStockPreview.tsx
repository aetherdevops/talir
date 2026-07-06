'use client'

import { LocaleLink } from '@/components/layout/LocaleLink'
import { IssuerDisplayName } from '@/components/common/IssuerDisplayName'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import type { StockSummary } from '@/lib/types'
import { useLocale } from '@/components/providers/LocaleProvider'

interface BreadthStockPreviewProps {
    stocks: StockSummary[]
    viewAllHref: string
    viewAllLabel: string
}

export function BreadthStockPreview({ stocks, viewAllHref, viewAllLabel }: BreadthStockPreviewProps) {
    const { t } = useLocale()

    if (!stocks.length) {
        return <p className="text-xs text-text-tertiary py-1">{t('home.noData')}</p>
    }

    return (
        <div className="rounded-lg border border-border bg-surface overflow-hidden">
            <ul className="divide-y divide-border">
                {stocks.map((stock) => (
                    <li key={stock.code}>
                        <LocaleLink
                            href={`/stock/${stock.code}`}
                            className="flex items-center gap-3 px-3 py-2 min-h-[44px] hover:bg-surface-secondary/70 transition-colors"
                        >
                            <span className="font-data text-[10px] font-bold text-text-secondary bg-surface-secondary rounded-md w-10 h-7 inline-flex items-center justify-center shrink-0">
                                {stock.code}
                            </span>
                            <IssuerDisplayName
                                code={stock.code}
                                name={stock.name}
                                className="text-sm font-medium text-text-primary truncate flex-1 min-w-0"
                            />
                            <ChangeLabel change={stock.changePercent} className="text-xs shrink-0" />
                        </LocaleLink>
                    </li>
                ))}
            </ul>
            <div className="border-t border-border px-3 py-2">
                <LocaleLink
                    href={viewAllHref}
                    className="text-xs font-semibold text-accent hover:text-accent/80 min-h-[44px] inline-flex items-center"
                >
                    {viewAllLabel}
                </LocaleLink>
            </div>
        </div>
    )
}
