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
}

interface StatCell {
    label: string
    value: string
}

function StatItem({ label, value }: StatCell) {
    return (
        <div className="flex flex-col gap-0.5 min-w-0">
            <span className="text-xs text-text-secondary">{label}</span>
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
    const latestDividend = latestDisclosedDividend(dividends)
    const exDate = latestDividend?.exDate
    const isPartialDividend = snapshot.dividendParseStatus === 'partial'

    const cells: StatCell[] = []

    if (eod.dayLow != null) cells.push({ label: 'Day low', value: formatPrice(eod.dayLow) })
    if (eod.dayHigh != null) cells.push({ label: 'Day high', value: formatPrice(eod.dayHigh) })
    if (eod.prevClose != null) cells.push({ label: 'Prev. close', value: formatPrice(eod.prevClose) })
    if (eod.volume != null && eod.volume > 0) {
        cells.push({ label: 'Volume', value: formatInteger(eod.volume) })
    }
    if (eod.avgVolume != null) {
        cells.push({ label: 'Avg. volume', value: formatInteger(Math.round(eod.avgVolume)) })
    }
    if (eod.turnover != null && eod.turnover > 0) {
        cells.push({ label: 'Turnover', value: formatPrice(eod.turnover) })
    }
    if (eod.avgPrice != null && eod.avgPrice > 0) {
        cells.push({ label: 'Avg. price', value: formatPrice(eod.avgPrice) })
    }
    if (eod.yearLow != null && eod.yearLow > 0) {
        cells.push({ label: '52-wk low', value: formatPrice(eod.yearLow) })
    }
    if (eod.yearHigh != null && eod.yearHigh > 0) {
        cells.push({ label: '52-wk high', value: formatPrice(eod.yearHigh) })
    }
    if (snapshot.peRatio != null) {
        cells.push({ label: 'P/E', value: formatPeRatio(snapshot.peRatio) })
    }
    if (snapshot.eps != null) cells.push({ label: 'EPS', value: formatEps(snapshot.eps) })
    if (snapshot.earningsYieldPct != null) {
        cells.push({ label: 'Earnings yield', value: formatPercent(snapshot.earningsYieldPct) })
    }
    if (snapshot.dividendYieldPct != null) {
        cells.push({ label: 'Dividend yield', value: formatPercent(snapshot.dividendYieldPct) })
    }
    if (snapshot.grossPerShare != null) {
        cells.push({
            label: 'Gross DPS',
            value: formatGrossDps(snapshot.grossPerShare, snapshot.dividendProfitYear),
        })
    }
    if (snapshot.payoutRatioPct != null) {
        cells.push({ label: 'Payout ratio', value: formatPercent(snapshot.payoutRatioPct, 1) })
    }
    if (exDate) cells.push({ label: 'Ex-dividend date', value: formatNewsDate(exDate) })
    if (eod.firstTradeDate) {
        cells.push({ label: 'First trade', value: formatNewsDate(eod.firstTradeDate) })
    }
    if (snapshot.fiscalYear != null) {
        cells.push({ label: 'Fiscal year', value: `FY ${snapshot.fiscalYear}` })
    }
    if (snapshot.netProfit != null) {
        cells.push({ label: 'Net profit', value: formatNetProfit(snapshot.netProfit) })
    }

    if (!cells.length) return null

    return (
        <section aria-label="Key statistics" className="border border-border rounded-xl bg-surface p-4 md:p-5">
            <h2 className="text-sm font-semibold text-text-primary mb-4">Key statistics</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-4">
                {cells.map((cell) => (
                    <StatItem key={cell.label} label={cell.label} value={cell.value} />
                ))}
            </div>
            {isPartialDividend ? (
                <p className="mt-4 text-[11px] font-data text-text-tertiary leading-snug">
                    Dividend figures from a partial SECNet parse — verify on the official filing.
                </p>
            ) : null}
        </section>
    )
}
