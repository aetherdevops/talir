import type { NewsCategory, NewsItem } from './types'

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

function stripReportPrefix(rawTitle: string): string {
    return rawTitle
        .replace(/^\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*/i, '')
        .replace(/^[^-]+-\s*/, '')
        .trim()
}

export function parseReportTitle(rawTitle: string, stockCode: string, stockName?: string): string {
    const body = stripReportPrefix(rawTitle)
    const lower = body.toLowerCase()
    const name = stockCode

    if (lower.includes('dividend')) {
        return `${name} announces dividend update`
    }
    if (lower.includes('profit') || lower.includes('loss') || lower.includes('p&l')) {
        const period = body.match(/(\d{2}\.\d{2}\.\s*-\s*\d{2}\.\d{2}\.)/)?.[1]
        return period
            ? `${name} posts ${period} profit & loss figures`
            : `${name} releases latest profit & loss report`
    }
    if (lower.includes('audited financial')) {
        return `${name} publishes audited financial statements`
    }
    if (lower.includes('financial statement') || lower.includes('non-audited')) {
        return `${name} files interim financial statements`
    }
    if (lower.includes('annual report')) {
        return `${name} releases annual report`
    }

    const short = body.length > 72 ? `${body.slice(0, 69)}…` : body
    return stockName ? `${name}: ${short}` : `${name}: ${short}`
}

export function buildNewsFromIssuers(
    issuers: IssuerWithReports[],
    limit: number,
    parseDate: (title: string, dateStr?: string) => Date,
    stockCodeFilter?: string
): NewsItem[] {
    const allReports: NewsItem[] = []

    issuers.forEach((issuer) => {
        if (stockCodeFilter && issuer.code !== stockCodeFilter) return
        if (!issuer.reportLinks) return

        issuer.reportLinks.forEach((report, index) => {
            const url = normalizeNewsUrl(report.url)
            if (!url) return

            const rawTitle = report.title
            const category = categorizeReport(rawTitle)

            allReports.push({
                id: `${issuer.code}-${index}`,
                rawTitle,
                title: parseReportTitle(rawTitle, issuer.code, issuer.name),
                source: 'MSE',
                stockCode: issuer.code,
                stockName: issuer.name,
                category,
                publishedAt: parseDate(rawTitle, report.date).toISOString(),
                url,
            })
        })
    })

    return allReports
        .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
        .slice(0, limit)
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
    earnings: 'Earnings',
    financials: 'Financials',
    dividend: 'Dividend',
    corporate: 'Corporate',
    other: 'Market',
}
