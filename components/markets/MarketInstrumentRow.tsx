'use client'

import { IssuerDisplayName } from '@/components/common/IssuerDisplayName'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatPrice, formatInteger, sparklineWindowChangePercent } from '@/lib/utils'
import { StockSummary } from '@/lib/types'
import { cn } from '@/lib/utils'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { IndexSparkline } from '@/components/home/IndexSparkline'
import { StockPageActions } from '@/components/stock/StockPageActions'

interface MarketInstrumentRowProps {
    stock: StockSummary
    sparkline?: { date: string; value: number }[]
    className?: string
}

export const MARKET_ROW_SPARKLINE_WIDTH = 56
export const MARKET_ROW_SPARKLINE_HEIGHT = 24
export const MARKET_ROW_CHANGE_WIDTH = 68
export const MARKET_ROW_PRICE_WIDTH = 76
export const MARKET_ROW_ACTION_WIDTH = 28

export function MarketInstrumentRow({ stock, sparkline, className }: MarketInstrumentRowProps) {
    const { t } = useLocale()
    const series = (sparkline ?? stock.chartSeries ?? []).slice(-30)
    const windowChange = sparklineWindowChangePercent(series)

    return (
        <LocaleLink
            href={stock.type === 'Index' ? `/market/${stock.code}` : `/stock/${stock.code}`}
            className={cn(
                'grid items-center gap-2 min-h-[44px] py-2 hover:bg-surface-secondary/60 transition-colors group min-w-0',
                'grid-cols-[minmax(0,1fr)_var(--sparkline)_var(--change)_var(--price)_var(--action)]',
                className
            )}
            style={{
                ['--sparkline' as string]: `${MARKET_ROW_SPARKLINE_WIDTH}px`,
                ['--change' as string]: `${MARKET_ROW_CHANGE_WIDTH}px`,
                ['--price' as string]: `${MARKET_ROW_PRICE_WIDTH}px`,
                ['--action' as string]: `${MARKET_ROW_ACTION_WIDTH}px`,
            }}
        >
            <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center justify-center rounded-md font-bold text-[10px] text-text-secondary bg-surface-secondary w-10 h-7 shrink-0 font-data">
                    {stock.code}
                </div>
                <div className="flex flex-col min-w-0 gap-0.5">
                    <span className="text-sm font-medium text-text-primary truncate leading-tight">
                        <IssuerDisplayName code={stock.code} name={stock.name} />
                    </span>
                    {stock.type !== 'Index' && (
                        <span className="text-[10px] text-text-tertiary font-data leading-none">
                            {t('markets.volumeAbbr')} {formatInteger(stock.volume)}
                        </span>
                    )}
                </div>
            </div>

            <div
                className="shrink-0 overflow-hidden justify-self-center"
                style={{ width: MARKET_ROW_SPARKLINE_WIDTH, height: MARKET_ROW_SPARKLINE_HEIGHT }}
            >
                <IndexSparkline
                    series={series}
                    changePercent={windowChange}
                    height={MARKET_ROW_SPARKLINE_HEIGHT}
                    className="w-full"
                />
            </div>

            <div
                className="flex justify-end shrink-0"
                style={{ width: MARKET_ROW_CHANGE_WIDTH }}
            >
                <ChangeLabel change={stock.changePercent} className="text-xs font-semibold" />
            </div>

            <span
                className="text-xs font-semibold text-text-primary font-data tabular-nums text-right shrink-0"
                style={{ width: MARKET_ROW_PRICE_WIDTH }}
            >
                {formatPrice(stock.price)}
            </span>

            <div
                className="shrink-0 justify-self-end"
                style={{ width: MARKET_ROW_ACTION_WIDTH }}
                onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                }}
            >
                <StockPageActions stockCode={stock.code} stockData={stock} variant="icon" />
            </div>
        </LocaleLink>
    )
}
