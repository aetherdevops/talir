import type { NewsItem } from './types'
import { formatNewsDate } from './utils'

export type ResultsReportKind = 'q1_pl' | 'q3_pl' | 'h1_fs' | 'fy_interim' | 'fy_audited'

export type ExpectedReportBasis = 'historical_median' | 'regulatory_deadline'

export interface ResultsCalendarEntry {
    stockCode: string
    stockName: string
    reportKind: ResultsReportKind
    periodStart: string | null
    periodEnd: string | null
    periodLabel: string | null
    filedAt: string
    headline: string
    url: string
    source: 'SECNet'
}

export interface ExpectedResultsEntry {
    stockCode: string
    stockName: string
    reportKind: ResultsReportKind
    periodEnd: string
    periodLabel: string
    expectedLabel: string
    basis: ExpectedReportBasis
    regulatoryLatest: string | null
}

export interface RegulatoryDeadline {
    reportKind: ResultsReportKind
    label: string
    latestDate: string
    note: string
}

export interface ResultsCalendarFile {
    generatedAt: string
    lastIssuerScan: string | null
    issuerCount: number
    recent: ResultsCalendarEntry[]
    all: ResultsCalendarEntry[]
    byIssuer: Record<string, ResultsCalendarEntry[]>
    expected: ExpectedResultsEntry[]
    regulatoryDeadlines: RegulatoryDeadline[]
}

export const REPORT_KIND_LABELS: Record<ResultsReportKind, string> = {
    q1_pl: 'Q1 P&L',
    q3_pl: '9M P&L',
    h1_fs: 'H1 statements',
    fy_interim: 'FY interim',
    fy_audited: 'FY audited',
}

const PERIOD_RANGE_RE = /(\d{2})\.(\d{2})\.?\s*[-–]\s*(\d{2})\.(\d{2})\.?/

export function parseReportPeriod(rawTitle: string): {
    startDay: number
    startMonth: number
    endDay: number
    endMonth: number
    label: string
} | null {
    const match = rawTitle.match(PERIOD_RANGE_RE)
    if (!match) return null

    const startDay = Number(match[1])
    const startMonth = Number(match[2])
    const endDay = Number(match[3])
    const endMonth = Number(match[4])

    if (
        startMonth < 1 ||
        startMonth > 12 ||
        endMonth < 1 ||
        endMonth > 12 ||
        startDay < 1 ||
        startDay > 31 ||
        endDay < 1 ||
        endDay > 31
    ) {
        return null
    }

    const label = `${String(startDay).padStart(2, '0')}.${String(startMonth).padStart(2, '0')}–${String(endDay).padStart(2, '0')}.${String(endMonth).padStart(2, '0')}`
    return { startDay, startMonth, endDay, endMonth, label }
}

function formatIso(year: number, month: number, day: number): string | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    const parsed = new Date(`${iso}T00:00:00Z`)
    if (Number.isNaN(parsed.getTime())) return null
    return iso
}

/** Infer calendar year for a period end from filing date (titles omit year). */
export function inferPeriodYear(
    endMonth: number,
    endDay: number,
    filedAt: string
): number | null {
    const filed = new Date(`${filedAt}T00:00:00Z`)
    if (Number.isNaN(filed.getTime())) return null

    const filedYear = filed.getUTCFullYear()
    const filedMonth = filed.getUTCMonth() + 1

    if (endMonth === 3 && endDay === 31) {
        return filedMonth >= 4 ? filedYear : filedYear - 1
    }
    if (endMonth === 6 && endDay === 30) {
        return filedMonth >= 7 ? filedYear : filedYear - 1
    }
    if (endMonth === 9 && endDay === 30) {
        return filedMonth >= 10 ? filedYear : filedYear - 1
    }
    if (endMonth === 12 && endDay === 31) {
        return filedMonth <= 6 ? filedYear - 1 : filedYear
    }

    return filedYear
}

export function isResultsReport(rawTitle: string): boolean {
    const lower = rawTitle.toLowerCase()
    if (lower.includes('dividend')) return false
    if (lower.includes('profit') || lower.includes('loss') || lower.includes('p&l')) return true
    if (lower.includes('audited financial')) return true
    if (lower.includes('financial statement') || lower.includes('non-audited financial')) return true
    return false
}

export function classifyReportKind(rawTitle: string, periodEndMonth?: number | null): ResultsReportKind {
    const lower = rawTitle.toLowerCase()

    if (lower.includes('audited financial')) return 'fy_audited'

    if (periodEndMonth === 3) return 'q1_pl'
    if (periodEndMonth === 6) return 'h1_fs'
    if (periodEndMonth === 9) return 'q3_pl'
    if (periodEndMonth === 12) {
        return lower.includes('audited') ? 'fy_audited' : 'fy_interim'
    }

    if (lower.includes('profit') || lower.includes('loss') || lower.includes('p&l')) {
        return 'q1_pl'
    }

    return 'fy_interim'
}

function entryDedupeKey(entry: Pick<ResultsCalendarEntry, 'stockCode' | 'reportKind' | 'periodEnd'>): string {
    return `${entry.stockCode}:${entry.reportKind}:${entry.periodEnd ?? 'unknown'}`
}

export function newsItemToResultsEntry(item: NewsItem): ResultsCalendarEntry | null {
    const rawTitle = item.rawTitle ?? item.title
    if (!isResultsReport(rawTitle)) return null
    if (!item.publishedAt) return null

    const period = parseReportPeriod(rawTitle)
    let periodStart: string | null = null
    let periodEnd: string | null = null
    let periodLabel = period?.label ?? null

    if (period) {
        const year = inferPeriodYear(period.endMonth, period.endDay, item.publishedAt)
        if (year) {
            periodStart = formatIso(year, period.startMonth, period.startDay)
            periodEnd = formatIso(year, period.endMonth, period.endDay)
        }
    }

    const reportKind = classifyReportKind(rawTitle, period?.endMonth ?? null)

    return {
        stockCode: item.stockCode,
        stockName: item.stockName ?? item.stockCode,
        reportKind,
        periodStart,
        periodEnd,
        periodLabel,
        filedAt: item.publishedAt,
        headline: item.title,
        url: item.url,
        source: 'SECNet',
    }
}

export function buildResultsEntriesFromNews(items: NewsItem[]): ResultsCalendarEntry[] {
    const byKey = new Map<string, ResultsCalendarEntry>()

    for (const item of items) {
        const entry = newsItemToResultsEntry(item)
        if (!entry) continue

        const key = entryDedupeKey(entry)
        const existing = byKey.get(key)
        if (!existing || entry.filedAt > existing.filedAt) {
            byKey.set(key, entry)
        }
    }

    return Array.from(byKey.values()).sort(
        (a, b) => new Date(b.filedAt).getTime() - new Date(a.filedAt).getTime()
    )
}

export const REGULATORY_DEADLINES: RegulatoryDeadline[] = [
    {
        reportKind: 'q1_pl',
        label: 'Q1 P&L',
        latestDate: '04-30',
        note: 'Unaudited profit and loss for period ending 31 March — regulatory latest 30 April.',
    },
    {
        reportKind: 'h1_fs',
        label: 'H1 statements',
        latestDate: '07-31',
        note: 'Unaudited financial statements for 01.01–30.06 — regulatory latest 31 July.',
    },
    {
        reportKind: 'q3_pl',
        label: '9M P&L',
        latestDate: '10-31',
        note: 'Unaudited profit and loss for period ending 30 September — regulatory latest 31 October.',
    },
    {
        reportKind: 'fy_audited',
        label: 'FY audited',
        latestDate: '05-31',
        note: 'Audited annual financial statements — regulatory latest 31 May.',
    },
]

function regulatoryLatestIso(reportKind: ResultsReportKind, year: number): string | null {
    const rule = REGULATORY_DEADLINES.find((d) => d.reportKind === reportKind)
    if (!rule) return null
    const [month, day] = rule.latestDate.split('-').map(Number)
    return formatIso(year, month, day)
}

function monthLabel(month: number): string {
    return (
        [
            'January',
            'February',
            'March',
            'April',
            'May',
            'June',
            'July',
            'August',
            'September',
            'October',
            'November',
            'December',
        ][month - 1] ?? ''
    )
}

function expectedWindowLabel(medianDayOfYear: number): string {
    const anchor = new Date(Date.UTC(2024, 0, 1))
    anchor.setUTCDate(medianDayOfYear)
    const month = anchor.getUTCMonth() + 1
    const day = anchor.getUTCDate()
    if (day <= 7) return `expected early ${monthLabel(month)}`
    if (day >= 24) return `expected late ${monthLabel(month)}`
    return `expected mid-${monthLabel(month)}`
}

function dayOfYear(iso: string): number {
    const d = new Date(`${iso}T00:00:00Z`)
    const start = Date.UTC(d.getUTCFullYear(), 0, 0)
    return Math.floor((d.getTime() - start) / 86400000)
}

function median(values: number[]): number | null {
    if (!values.length) return null
    const sorted = [...values].sort((a, b) => a - b)
    const mid = Math.floor(sorted.length / 2)
    return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2)
}

/** Which report kinds are due after a calendar date (approximate season). */
function dueReportKinds(referenceDate: Date): ResultsReportKind[] {
    const month = referenceDate.getUTCMonth() + 1
    const due: ResultsReportKind[] = []

    if (month >= 4) due.push('q1_pl')
    if (month >= 7) due.push('h1_fs')
    if (month >= 10) due.push('q3_pl')
    if (month >= 1) due.push('fy_interim', 'fy_audited')

    return due
}

function targetPeriodEnd(reportKind: ResultsReportKind, referenceDate: Date): { iso: string; label: string } {
    const year = referenceDate.getUTCFullYear()
    const month = referenceDate.getUTCMonth() + 1

    switch (reportKind) {
        case 'q1_pl': {
            const periodYear = month >= 4 ? year : year - 1
            return {
                iso: `${periodYear}-03-31`,
                label: `01.01–31.03.${String(periodYear).slice(-2)}`,
            }
        }
        case 'h1_fs': {
            const periodYear = month >= 7 ? year : year - 1
            return {
                iso: `${periodYear}-06-30`,
                label: `01.01–30.06.${String(periodYear).slice(-2)}`,
            }
        }
        case 'q3_pl': {
            const periodYear = month >= 10 ? year : year - 1
            return {
                iso: `${periodYear}-09-30`,
                label: `01.01–30.09.${String(periodYear).slice(-2)}`,
            }
        }
        case 'fy_interim':
        case 'fy_audited': {
            const periodYear = month <= 6 ? year - 1 : year
            return {
                iso: `${periodYear}-12-31`,
                label: `FY ${periodYear}`,
            }
        }
    }
}

export function buildExpectedResults(
    entries: ResultsCalendarEntry[],
    referenceDate = new Date()
): ExpectedResultsEntry[] {
    const filedKeys = new Set(entries.map(entryDedupeKey))
    const historyByCodeKind = new Map<string, number[]>()
    const namesByCode = new Map<string, string>()

    for (const entry of entries) {
        namesByCode.set(entry.stockCode, entry.stockName)
        const key = `${entry.stockCode}:${entry.reportKind}`
        const list = historyByCodeKind.get(key) ?? []
        list.push(dayOfYear(entry.filedAt))
        historyByCodeKind.set(key, list)
    }

    const expected: ExpectedResultsEntry[] = []
    const codes = [...new Set(entries.map((e) => e.stockCode))]

    for (const code of codes) {
        const stockName = namesByCode.get(code) ?? code

        for (const reportKind of dueReportKinds(referenceDate)) {
            if (reportKind === 'fy_interim') continue

            const { iso: periodEnd, label: periodLabel } = targetPeriodEnd(reportKind, referenceDate)
            const dedupeKey = `${code}:${reportKind}:${periodEnd}`
            if (filedKeys.has(dedupeKey)) continue

            const historyKey = `${code}:${reportKind}`
            const history = historyByCodeKind.get(historyKey) ?? []
            const med = median(history)

            if (med !== null && history.length >= 2) {
                expected.push({
                    stockCode: code,
                    stockName,
                    reportKind,
                    periodEnd,
                    periodLabel,
                    expectedLabel: expectedWindowLabel(med),
                    basis: 'historical_median',
                    regulatoryLatest: regulatoryLatestIso(reportKind, referenceDate.getUTCFullYear()),
                })
            }
        }
    }

    expected.sort((a, b) => {
        const kindOrder: ResultsReportKind[] = ['q1_pl', 'h1_fs', 'q3_pl', 'fy_audited']
        const ka = kindOrder.indexOf(a.reportKind)
        const kb = kindOrder.indexOf(b.reportKind)
        if (ka !== kb) return ka - kb
        return a.stockCode.localeCompare(b.stockCode)
    })

    return expected
}

export function buildResultsCalendarFile(
    items: NewsItem[],
    meta: { lastIssuerScan: string | null; issuerCount: number },
    referenceDate = new Date()
): ResultsCalendarFile {
    const all = buildResultsEntriesFromNews(items)
    const recent = all.filter((entry) => {
        const filed = new Date(`${entry.filedAt}T00:00:00Z`)
        const cutoff = new Date(referenceDate)
        cutoff.setUTCDate(cutoff.getUTCDate() - 90)
        return filed >= cutoff
    })

    const byIssuer: Record<string, ResultsCalendarEntry[]> = {}
    for (const entry of all) {
        if (!byIssuer[entry.stockCode]) byIssuer[entry.stockCode] = []
        byIssuer[entry.stockCode].push(entry)
    }

    return {
        generatedAt: new Date().toISOString(),
        lastIssuerScan: meta.lastIssuerScan,
        issuerCount: meta.issuerCount,
        recent,
        all,
        byIssuer,
        expected: buildExpectedResults(all, referenceDate),
        regulatoryDeadlines: REGULATORY_DEADLINES,
    }
}

function formatPeriodSuffix(entry: ResultsCalendarEntry): string | null {
    if (entry.reportKind === 'fy_audited' || entry.reportKind === 'fy_interim') {
        const year = entry.periodEnd?.slice(0, 4)
        return year ? `FY ${year}` : null
    }
    return entry.periodLabel
}

export function formatFiledResultsLine(entry: ResultsCalendarEntry): string {
    const kind = REPORT_KIND_LABELS[entry.reportKind]
    const filed = formatNewsDate(entry.filedAt)
    const period = formatPeriodSuffix(entry)
    if (period) return `${kind} · ${period} · filed ${filed}`
    return `${kind} · filed ${filed}`
}

export function formatExpectedResultsLine(entry: ExpectedResultsEntry, includeRegulatory: boolean): string {
    const kind = REPORT_KIND_LABELS[entry.reportKind]
    let line = `${kind} · ${entry.expectedLabel}`
    if (includeRegulatory && entry.regulatoryLatest) {
        line += ` · regulatory latest ${formatNewsDate(entry.regulatoryLatest)}`
    }
    return line
}
