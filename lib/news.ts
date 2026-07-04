import type { NewsCategory, NewsItem } from './types'
import { parseReportDate } from './news-dates'
import { parseReportTitle } from './news-style'

interface ReportLink {
    title: string
    url: string
    date?: string
}

interface IssuerWithReports {
    code: string
    name: string
    reportLinks?: ReportLink[]
}

export function normalizeNewsUrl(url: string | undefined): string | null {
    if (!url?.trim()) return null
    const trimmed = url.trim()
    if (trimmed === '#' || trimmed.startsWith('javascript:')) return null
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    return `https://${trimmed}`
}

export function categorizeReport(rawTitle: string): NewsCategory {
    const lower = rawTitle.toLowerCase()
    if (lower.includes('dividend')) return 'dividend'
    if (lower.includes('profit') || lower.includes('loss') || lower.includes('p&l')) return 'earnings'
    if (lower.includes('financial statement') || lower.includes('balance sheet') || lower.includes('audited')) {
        return 'financials'
    }
    if (lower.includes('annual report') || lower.includes('corporate') || lower.includes('governance')) {
        return 'corporate'
    }
    return 'other'
}

export type NewsFeedBuildResult = {
    items: NewsItem[]
    undatedByCode: Record<string, NewsItem[]>
}

export function buildNewsFeedFromIssuers(issuers: IssuerWithReports[]): NewsFeedBuildResult {
    const seenUrls = new Set<string>()
    const datedItems: NewsItem[] = []
    const undatedByCode: Record<string, NewsItem[]> = {}

    for (const issuer of issuers) {
        if (!issuer.reportLinks?.length) continue

        for (const report of issuer.reportLinks) {
            const url = normalizeNewsUrl(report.url)
            if (!url) continue

            const dedupeKey = url.toLowerCase()
            if (seenUrls.has(dedupeKey)) continue
            seenUrls.add(dedupeKey)

            const rawTitle = report.title
            const isoDate = parseReportDate(rawTitle, report.date)
            const category = categorizeReport(rawTitle)
            const item: NewsItem = {
                id: `${issuer.code}-${dedupeKey.replace(/[^a-z0-9]+/gi, '-').slice(0, 48)}`,
                rawTitle,
                title: parseReportTitle(rawTitle, issuer.code),
                source: 'SECNet',
                stockCode: issuer.code,
                stockName: issuer.name,
                category,
                publishedAt: isoDate,
                dateKnown: isoDate !== null,
                url,
            }

            if (isoDate) {
                datedItems.push(item)
            } else {
                if (!undatedByCode[issuer.code]) undatedByCode[issuer.code] = []
                undatedByCode[issuer.code].push(item)
            }
        }
    }

    datedItems.sort(
        (a, b) => new Date(b.publishedAt!).getTime() - new Date(a.publishedAt!).getTime()
    )

    for (const code of Object.keys(undatedByCode)) {
        undatedByCode[code].sort((a, b) => a.title.localeCompare(b.title))
    }

    return { items: datedItems, undatedByCode }
}

export {
    NEWS_CATEGORY_LABELS,
    UPDATES_SECTION_TITLE,
    UPDATES_SECTION_SUBTITLE,
    FILINGS_SECTION_TITLE,
    FILINGS_SECTION_SUBTITLE,
} from './news-style'
