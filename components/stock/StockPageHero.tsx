'use client'

import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { IssuerDisplayName } from '@/components/common/IssuerDisplayName'
import { StockPageActions } from '@/components/stock/StockPageActions'
import { useLocale } from '@/components/providers/LocaleProvider'
import { translateSector } from '@/lib/sectors'
import { formatDecimal, formatPrice } from '@/lib/utils'
import type { StockSummary } from '@/lib/types'

interface StockPageHeroProps {
    code: string
    name: string
    sector?: string
    price: number
    changePercent: number
    absChange: number
    changeLabel: string
    asOfDate: string
    stockData: StockSummary
}

export function StockPageHero({
    code,
    name,
    sector,
    price,
    changePercent,
    absChange,
    changeLabel,
    asOfDate,
    stockData,
}: StockPageHeroProps) {
    const { t } = useLocale()

    return (
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-border pb-6">
            <div className="flex flex-col gap-2 min-w-0">
                <span className="font-data text-xs font-semibold uppercase tracking-wider text-text-secondary tabular-nums">
                    {code}
                </span>
                <h1 className="font-heading text-2xl md:text-[28px] font-bold text-text-primary tracking-tight leading-tight">
                    <IssuerDisplayName code={code} name={name} />
                </h1>
                <div className="flex items-end gap-3 mt-1 flex-wrap">
                    <span className="font-data text-4xl font-bold text-text-primary tabular-nums tracking-tight">
                        {formatPrice(price)}
                    </span>
                    <div className="mb-1 flex items-center gap-2 flex-wrap">
                        <ChangeLabel change={changePercent} variant="pill" className="text-sm" />
                        <span className="text-sm text-text-secondary font-data tabular-nums">
                            ({absChange > 0 ? '+' : ''}{formatDecimal(absChange)} ден.) {changeLabel}
                        </span>
                    </div>
                </div>
                <DataFreshnessLabel asOfDate={asOfDate} />
                {sector ? (
                    <span className="text-xs text-text-secondary font-data">
                        {translateSector(sector, t)}
                    </span>
                ) : null}
            </div>

            <StockPageActions stockCode={code} stockData={stockData} className="shrink-0" />
        </div>
    )
}
