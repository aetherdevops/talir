import { CHANGE_ZERO_THRESHOLD } from '@/lib/utils'
import type { StockSummary } from '@/lib/types'
import { isExcludedEquityCode } from '@/lib/market-universe'

export type BreadthMove = 'up' | 'down' | 'flat'

export type BreadthRange = '52w-high' | '52w-low'

export function isMseEquityStock(stock: StockSummary): boolean {
    if (stock.type === 'Index') return false
    if (isExcludedEquityCode(stock.code)) return false
    return stock.price > 0 || stock.volume > 0
}

export function classifyStockMove(changePercent: number): BreadthMove {
    if (changePercent >= CHANGE_ZERO_THRESHOLD) return 'up'
    if (changePercent <= -CHANGE_ZERO_THRESHOLD) return 'down'
    return 'flat'
}

export function filterStocksByMove(stocks: StockSummary[], move: BreadthMove): StockSummary[] {
    const filtered = stocks.filter(isMseEquityStock).filter((stock) => classifyStockMove(stock.changePercent) === move)

    if (move === 'up') {
        return filtered.sort((a, b) => b.changePercent - a.changePercent)
    }
    if (move === 'down') {
        return filtered.sort((a, b) => a.changePercent - b.changePercent)
    }
    return filtered.sort((a, b) => b.turnover - a.turnover)
}

export function resolveStocksByCodes(stocks: StockSummary[], codes: string[]): StockSummary[] {
    const byCode = new Map(stocks.map((stock) => [stock.code, stock]))
    return codes.map((code) => byCode.get(code)).filter((stock): stock is StockSummary => stock != null)
}

export function filterStocksByRange(
    stocks: StockSummary[],
    range: BreadthRange,
    high52wCodes: string[],
    low52wCodes: string[]
): StockSummary[] {
    const codes = new Set(range === '52w-high' ? high52wCodes : low52wCodes)
    return stocks
        .filter(isMseEquityStock)
        .filter((stock) => codes.has(stock.code))
        .sort((a, b) => b.turnover - a.turnover)
}
