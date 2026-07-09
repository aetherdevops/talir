'use client'

import type { StockValuationSnapshot } from '@/lib/stock-valuation'
import type { DividendCalendarEntry } from '@/lib/dividends'
import { latestDisclosedDividend } from '@/lib/dividends'
import {
    formatEps,
    formatGrossDps,
    formatNetProfit,
    formatPeRatio,
    formatPercent,
} from '@/lib/stock-fundamentals-display'
import { formatInteger, formatNewsDate, formatPrice } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'
import { InfoPopover } from '@/components/ui/InfoPopover'

export interface StockEodStats {
    dayLow: number | null
    dayHigh: number | null
    prevClose: number | null
    volume: number | null
    avgVolume: number | null
    turnover: number | null
    avgPrice: number | null
    yearLow: number | null
    yearHigh: number | null
    firstTradeDate: string | null
    marketCapThousandsMkd: number | null
}

interface StatCell {
    label: string
    value: string
    helpKey: string
}

function StatItem({ label, value, helpKey }: StatCell) {
    const { t } = useLocale()

    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-text-secondary inline-flex items-center gap-1 min-w-0">
                <span className="truncate">{label}</span>
                <InfoPopover label={label}>{t(`stock.statHelp.${helpKey}`)}</InfoPopover>
            </span>
            <span className="text-sm font-data font-medium text-text-primary tabular-nums">{value}</span>
        </div>
    )
}

interface StockKeyStatisticsGridProps {
    eod: StockEodStats
    snapshot: StockValuationSnapshot
    dividends: DividendCalendarEntry[]
}

export function StockKeyStatisticsGrid({ eod, snapshot, dividends }: StockKeyStatisticsGridProps) {
    const { t } = useLocale()
    const latestDividend = latestDisclosedDividend(dividends)
    const exDate = latestDividend?.exDate
    const isPartialDividend = snapshot.dividendParseStatus === 'partial'

    const cells: StatCell[] = []

    if (eod.dayLow != null) cells.push({ label: t('stock.dayLow'), value: formatPrice(eod.dayLow), helpKey: 'dayLow' })
    if (eod.dayHigh != null) cells.push({ label: t('stock.dayHigh'), value: formatPrice(eod.dayHigh), helpKey: 'dayHigh' })
    if (eod.prevClose != null) cells.push({ label: t('stock.prevClose'), value: formatPrice(eod.prevClose), helpKey: 'prevClose' })
    if (eod.volume != null && eod.volume > 0) {
        cells.push({ label: t('stock.volume'), value: formatInteger(eod.volume), helpKey: 'volume' })
    }
    if (eod.avgVolume != null) {
        cells.push({
            label: t('stock.avgVolume'),
            value: formatInteger(Math.round(eod.avgVolume)),
            helpKey: 'avgVolume',
        })
    }
    if (eod.turnover != null && eod.turnover > 0) {
        cells.push({ label: t('stock.turnover'), value: formatPrice(eod.turnover), helpKey: 'turnover' })
    }
    if (eod.avgPrice != null && eod.avgPrice > 0) {
        cells.push({ label: t('stock.avgPrice'), value: formatPrice(eod.avgPrice), helpKey: 'avgPrice' })
    }
    if (eod.yearLow != null && eod.yearLow > 0) {
        cells.push({ label: t('stock.weekLow52'), value: formatPrice(eod.yearLow), helpKey: 'weekLow52' })
    }
    if (eod.yearHigh != null && eod.yearHigh > 0) {
        cells.push({ label: t('stock.weekHigh52'), value: formatPrice(eod.yearHigh), helpKey: 'weekHigh52' })
    }
    if (eod.marketCapThousandsMkd != null && eod.marketCapThousandsMkd > 0) {
        cells.push({
            label: t('stock.marketCap'),
            value: `${formatInteger(eod.marketCapThousandsMkd)} 000 ${t('common.den')}`,
            helpKey: 'marketCap',
        })
    }
    if (snapshot.peRatio != null) {
        cells.push({ label: t('stock.pe'), value: formatPeRatio(snapshot.peRatio), helpKey: 'pe' })
    }
    if (snapshot.eps != null) cells.push({ label: t('stock.eps'), value: formatEps(snapshot.eps), helpKey: 'eps' })
    if (snapshot.earningsYieldPct != null) {
        cells.push({
            label: t('stock.earningsYield'),
            value: formatPercent(snapshot.earningsYieldPct),
            helpKey: 'earningsYield',
        })
    }
    if (snapshot.dividendYieldPct != null) {
        cells.push({
            label: t('stock.dividendYield'),
            value: formatPercent(snapshot.dividendYieldPct),
            helpKey: 'dividendYield',
        })
    }
    if (snapshot.grossPerShare != null) {
        cells.push({
            label: t('stock.grossDps'),
            value: formatGrossDps(snapshot.grossPerShare, snapshot.dividendProfitYear),
            helpKey: 'grossDps',
        })
    }
    if (snapshot.payoutRatioPct != null) {
        cells.push({
            label: t('stock.payoutRatio'),
            value: formatPercent(snapshot.payoutRatioPct, 1),
            helpKey: 'payoutRatio',
        })
    }
    if (exDate) cells.push({ label: t('stock.exDate'), value: formatNewsDate(exDate), helpKey: 'exDate' })
    if (eod.firstTradeDate) {
        cells.push({ label: t('stock.firstTrade'), value: formatNewsDate(eod.firstTradeDate), helpKey: 'firstTrade' })
    }
    if (snapshot.fiscalYear != null) {
        cells.push({
            label: t('stock.fiscalYear'),
            value: t('common.fy', { year: snapshot.fiscalYear }),
            helpKey: 'fiscalYear',
        })
    }
    if (snapshot.netProfit != null) {
        cells.push({ label: t('stock.netProfit'), value: formatNetProfit(snapshot.netProfit), helpKey: 'netProfit' })
    }

    if (!cells.length) return null

    return (
        <section aria-label={t('stock.keyStatistics')} className="border border-border rounded-xl bg-surface p-4 md:p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">{t('stock.keyStatistics')}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                {cells.map((cell) => (
                    <StatItem key={cell.helpKey} label={cell.label} value={cell.value} helpKey={cell.helpKey} />
                ))}
            </div>
            {isPartialDividend ? (
                <p className="mt-4 text-[11px] font-data text-text-tertiary leading-snug">
                    {t('stock.partialParse')}
                </p>
            ) : null}
        </section>
    )
}
