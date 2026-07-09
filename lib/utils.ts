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

export function formatCompactThousands(value: number) {
    const abs = Math.abs(value)
    if (abs >= 1_000_000) {
        return `${formatDecimal(abs / 1_000_000, 1)}M`
    }
    if (abs >= 1_000) {
        return `${formatDecimal(abs / 1_000, 1)}K`
    }
    return formatInteger(abs)
}

/** Index levels are points, not currency — no ден. suffix. */
export function formatIndexLevel(value: number) {
    return formatDecimalParts(value, 2)
}

export function formatIndexLevelCompact(value: number) {
    return formatDecimalParts(value, 0)
}

export const CHANGE_ZERO_THRESHOLD = 0.005

export type ChangeDirection = 'up' | 'down' | 'neutral'

/** Rounding-aware sign for day-over-day % (brand rule §4). */
export function classifyChangePercent(pct: number): ChangeDirection {
    if (Math.abs(pct) < CHANGE_ZERO_THRESHOLD) return 'neutral'
    return pct > 0 ? 'up' : 'down'
}

export function formatPriceChange(change: number) {
    if (classifyChangePercent(change) === 'neutral') return '0.00%'
    if (change > 0) return `+${change.toFixed(2)}%`
    return `−${Math.abs(change).toFixed(2)}%`
}

/** Macedonian-style date for news filings, e.g. 12.11.2025 */
export function formatNewsDate(dateStr: string): string {
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return dateStr
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}.${month}.${year}`
}

/** Token-aligned hex fills for chart libs (e.g. treemap) that cannot use CSS variables. */
export function getChangeTreemapFill(pct: number): string {
    const dir = classifyChangePercent(pct)
    if (dir === 'neutral') return '#5a6577'
    const abs = Math.abs(pct)
    if (dir === 'up') {
        if (abs > 3) return '#1a7a47'
        if (abs > 1) return '#22885a'
        return '#54c98c'
    }
    if (abs > 3) return '#c2362f'
    if (abs > 1) return '#d44a42'
    return '#f0726a'
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

/** Window change % for sparkline coloring (first vs last close in rendered series). */
export function sparklineWindowChangePercent(series: { value: number }[]): number {
    if (series.length < 2) return 0
    const first = series[0].value
    const last = series[series.length - 1].value
    if (first === 0) return last > first ? 100 : last < first ? -100 : 0
    return ((last - first) / first) * 100
}
