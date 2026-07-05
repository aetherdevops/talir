import { formatDecimal, formatInteger } from './utils'

export function formatNetProfit(value: number): string {
    if (value >= 1_000_000) {
        return `${formatDecimal(value / 1_000_000, 2)}M ден.`
    }
    return `${formatInteger(value)} ден.`
}

export function formatEps(value: number): string {
    return `${formatDecimal(value, 2)} ден.`
}

export function formatPeRatio(value: number): string {
    return `${formatDecimal(value, 1)}×`
}

export function formatPercent(value: number, decimals = 2): string {
    return `${formatDecimal(value, decimals)}%`
}

export function formatGrossDps(value: number, profitYear?: number | null): string {
    const base = `${formatDecimal(value, 2)} ден.`
    return profitYear ? `${base} (FY ${profitYear})` : base
}
