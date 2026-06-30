import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

/** Macedonian-style grouping: 1.234.567,89 (SSR-safe, no Intl locale drift). */
function formatDecimalParts(value: number, fractionDigits: number) {
    const sign = value < 0 ? '-' : ''
    const abs = Math.abs(value)
    const fixed = abs.toFixed(fractionDigits)
    const [intPart, decPart] = fixed.split('.')
    const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.')

    if (fractionDigits === 0) return `${sign}${grouped}`
    return `${sign}${grouped},${decPart}`
}

export function formatDecimal(value: number, fractionDigits = 2) {
    return formatDecimalParts(value, fractionDigits)
}

export function formatInteger(value: number) {
    return formatDecimalParts(value, 0)
}

export function formatPrice(price: number) {
    return `${formatDecimalParts(price, 2)} ден.`
}

export function formatPriceCompact(price: number) {
    return `${formatDecimalParts(price, 0)} ден.`
}

export function formatPriceChange(change: number) {
    if (change === 0) return "0.00%"
    return (change > 0 ? "+" : "") + change.toFixed(2) + "%"
}

/** Human-readable end-of-day label, e.g. "12 Dec 2025". */
export function formatAsOfDate(dateStr: string): string {
    const d = new Date(`${dateStr}T12:00:00`)
    if (Number.isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** Period change % from first to last point in a chart series (e.g. 12M). */
export function getPeriodChangePercent(series: { value: number }[]): number {
    if (!series.length) return 0
    const first = series[0].value
    const last = series[series.length - 1].value
    if (first === 0) return 0
    return ((last - first) / first) * 100
}
