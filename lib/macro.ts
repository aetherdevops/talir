/**
 * Macro dashboard types and time-comparison helpers.
 * Series are ingested from MakStat / NBRM / MoF into Supabase, then written to derived_macro.json.
 */

import { CHANGE_ZERO_THRESHOLD, type ChangeDirection } from './utils'

export type MacroFrequency = 'monthly' | 'quarterly' | 'annual'

export type MacroChartRange = '1Y' | '5Y' | '10Y' | 'max'

export type MacroSeriesCategory = 'headline' | 'industry'

export type MacroPoint = {
    date: string
    value: number
}

export type MacroSeries = {
    id: string
    labelEn: string
    labelMk: string
    unit: '%' | 'pp' | 'index'
    /** How to interpret period-to-period absolute change in the UI. */
    deltaUnit: 'pp' | '%' | 'pts'
    frequency: MacroFrequency
    category: MacroSeriesCategory
    sourceAgency: string
    sourceLabel: string
    sourceUrl: string | null
    /** KPI strip inclusion order; null = grid-only */
    kpiOrder: number | null
    points: MacroPoint[]
}

export type MacroNewsItem = {
    id: string
    date: string
    titleEn: string
    titleMk: string
}

export type MacroFile = {
    generatedAt: string
    asOfDate: string
    /** ISO timestamp of last successful/partial ingest run */
    lastIngestedAt: string | null
    disclaimerEn: string
    disclaimerMk: string
    series: MacroSeries[]
    news: MacroNewsItem[]
}

export type MacroDelta = {
    absolute: number
    kind: ChangeDirection
    baseline: 'prior' | 'year_ago'
}

export function latestPoint(points: MacroPoint[]): MacroPoint | null {
    if (!points.length) return null
    return points[points.length - 1] ?? null
}

export function priorPoint(points: MacroPoint[]): MacroPoint | null {
    if (points.length < 2) return null
    return points[points.length - 2] ?? null
}

function classifyAbsoluteDelta(delta: number): ChangeDirection {
    if (Math.abs(delta) < CHANGE_ZERO_THRESHOLD) return 'neutral'
    return delta > 0 ? 'up' : 'down'
}

export function changeVsPrior(points: MacroPoint[]): MacroDelta | null {
    const latest = latestPoint(points)
    const prior = priorPoint(points)
    if (!latest || !prior) return null
    const absolute = latest.value - prior.value
    return { absolute, kind: classifyAbsoluteDelta(absolute), baseline: 'prior' }
}

/** Same calendar month/quarter one year earlier (match by YYYY-MM when possible). */
export function yearAgoPoint(points: MacroPoint[], referenceDate?: string): MacroPoint | null {
    const latest = referenceDate
        ? points.find((p) => p.date === referenceDate) ?? latestPoint(points)
        : latestPoint(points)
    if (!latest) return null
    const target = shiftIsoYears(latest.date, -1)
    if (!target) return null

    const exact = points.find((p) => p.date === target)
    if (exact) return exact

    // Fall back: closest point within ~45 days of target
    const targetMs = Date.parse(target)
    let best: MacroPoint | null = null
    let bestDist = Infinity
    for (const p of points) {
        const dist = Math.abs(Date.parse(p.date) - targetMs)
        if (dist < bestDist && dist <= 45 * 86_400_000) {
            best = p
            bestDist = dist
        }
    }
    return best
}

export function changeVsYearAgo(points: MacroPoint[]): MacroDelta | null {
    const latest = latestPoint(points)
    const ago = yearAgoPoint(points)
    if (!latest || !ago) return null
    const absolute = latest.value - ago.value
    return { absolute, kind: classifyAbsoluteDelta(absolute), baseline: 'year_ago' }
}

function shiftIsoYears(isoDate: string, years: number): string | null {
    const m = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/)
    if (!m) return null
    const y = Number(m[1]) + years
    return `${y}-${m[2]}-${m[3]}`
}

const RANGE_YEARS: Record<Exclude<MacroChartRange, 'max'>, number> = {
    '1Y': 1,
    '5Y': 5,
    '10Y': 10,
}

export function sliceByRange(points: MacroPoint[], range: MacroChartRange): MacroPoint[] {
    if (!points.length || range === 'max') return [...points]
    const latest = latestPoint(points)
    if (!latest) return []
    const cutoff = shiftIsoYears(latest.date, -RANGE_YEARS[range])
    if (!cutoff) return [...points]
    return points.filter((p) => p.date >= cutoff)
}

/** YoY change series aligned to each point that has a year-ago peer. */
export function yoySeries(points: MacroPoint[]): MacroPoint[] {
    const out: MacroPoint[] = []
    for (const p of points) {
        const ago = yearAgoPoint(points, p.date)
        if (!ago) continue
        out.push({ date: p.date, value: p.value - ago.value })
    }
    return out
}

export function formatMacroValue(value: number, unit: MacroSeries['unit'], digits = 1): string {
    const n = value.toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })
    if (unit === '%') return `${n}%`
    if (unit === 'pp') return `${n} pp`
    return n
}

export function formatMacroDelta(
    delta: MacroDelta,
    deltaUnit: MacroSeries['deltaUnit'],
    digits = 1
): string {
    if (delta.kind === 'neutral') {
        return deltaUnit === 'pp' ? `0.0 pp` : deltaUnit === '%' ? `0.0%` : `0.0`
    }
    const sign = delta.absolute > 0 ? '+' : '−'
    const mag = Math.abs(delta.absolute).toLocaleString('en-US', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
    })
    if (deltaUnit === 'pp') return `${sign}${mag} pp`
    if (deltaUnit === '%') return `${sign}${mag}%`
    return `${sign}${mag}`
}

export function priorBaselineLabel(
    frequency: MacroFrequency,
    baseline: MacroDelta['baseline']
): 'vsPriorMonth' | 'vsPriorQuarter' | 'vsPriorYear' | 'vsYearAgo' {
    if (baseline === 'year_ago') return 'vsYearAgo'
    if (frequency === 'monthly') return 'vsPriorMonth'
    if (frequency === 'quarterly') return 'vsPriorQuarter'
    return 'vsPriorYear'
}

export function getKpiSeries(file: MacroFile): MacroSeries[] {
    return file.series
        .filter((s) => s.kpiOrder !== null && (s.category ?? 'headline') === 'headline')
        .sort((a, b) => (a.kpiOrder ?? 0) - (b.kpiOrder ?? 0))
}

export function getHeadlineSeries(file: MacroFile): MacroSeries[] {
    return file.series.filter((s) => (s.category ?? 'headline') === 'headline')
}

export function getIndustrySeries(file: MacroFile): MacroSeries[] {
    return file.series.filter((s) => s.category === 'industry')
}

export function findSeries(file: MacroFile, id: string): MacroSeries | null {
    return file.series.find((s) => s.id === id) ?? null
}
