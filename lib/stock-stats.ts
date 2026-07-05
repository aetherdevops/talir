import type { DailyPrice } from './types'

/** Previous session close from EOD history (second-to-last row). */
export function computePrevClose(history: DailyPrice[]): number | null {
    if (history.length < 2) return null
    const prev = history[history.length - 2]?.last_transaction_price
    return prev != null && prev > 0 ? prev : null
}

/** Mean traded quantity over the last N sessions with volume > 0. */
export function computeAvgVolume(history: DailyPrice[], sessions = 20): number | null {
    if (!history.length) return null

    const withVolume = history.filter((row) => row.quantity > 0)
    if (!withVolume.length) return null

    const slice = withVolume.slice(-sessions)
    const sum = slice.reduce((acc, row) => acc + row.quantity, 0)
    return sum / slice.length
}

export function computeYearRange(
    chartData: { time: string; value: number }[]
): { low: number | null; high: number | null } {
    const cut = new Date()
    cut.setFullYear(cut.getFullYear() - 1)
    const yearData = chartData.filter((d) => new Date(d.time) >= cut)
    if (!yearData.length) return { low: null, high: null }
    return {
        low: Math.min(...yearData.map((d) => d.value)),
        high: Math.max(...yearData.map((d) => d.value)),
    }
}
