/**
 * Editorial headline rules for filing titles.
 * Human-readable standard: docs/editorial-style.md
 */

import type { NewsCategory } from './types'

const HYPE_VERBS =
    /\b(shocks?|soars?|plunges?|rockets?|bombshell|alert|skyrockets?|tumbles?|surges?|crashes?)\b/i

function stripReportPrefix(rawTitle: string): string {
    return rawTitle
        .replace(/^\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*/i, '')
        .replace(/^[^-]+-\s*/, '')
        .trim()
}

function normalizePeriod(raw: string): string {
    return raw.replace(/\s*-\s*/g, '–').replace(/\.\s*$/, '').trim()
}

function truncate(text: string, max = 72): string {
    return text.length > max ? `${text.slice(0, max - 1)}…` : text
}

/** Returns null if headline would violate editorial rules (caller may fall back to neutral filing line). */
export function containsHypeLanguage(text: string): boolean {
    return HYPE_VERBS.test(text)
}

export function parseReportTitle(rawTitle: string, stockCode: string): string {
    const body = stripReportPrefix(rawTitle)
    const lower = body.toLowerCase()
    const code = stockCode

    if (lower.includes('dividend')) {
        return `${code} files dividend disclosure`
    }

    if (lower.includes('distribution of profit')) {
        return `${code} files distribution of profit disclosure`
    }

    if (lower.includes('profit') || lower.includes('loss') || lower.includes('p&l')) {
        const period = body.match(/(\d{2}\.\d{2}\.\s*[-–]\s*\d{2}\.\d{2}\.?)/)?.[1]
        const normalizedPeriod = period ? normalizePeriod(period) : null

        if (lower.includes('loss') && !lower.includes('profit')) {
            return normalizedPeriod
                ? `${code} reports loss for ${normalizedPeriod}`
                : `${code} reports loss in profit and loss filing`
        }

        return normalizedPeriod
            ? `${code} reports profit and loss for ${normalizedPeriod}`
            : `${code} files profit and loss report`
    }

    if (lower.includes('audited financial')) {
        return `${code} files audited financial statements`
    }

    if (lower.includes('financial statement') || lower.includes('non-audited')) {
        return `${code} files interim financial statements`
    }

    if (lower.includes('annual report')) {
        return `${code} files annual report`
    }

    if (lower.includes('corporate governance') || lower.includes('governance')) {
        return `${code} files corporate governance disclosure`
    }

    const short = truncate(body)
    const headline = `${code}: ${short}`
    if (containsHypeLanguage(headline)) {
        return `${code} files regulatory disclosure`
    }

    return headline
}

export const NEWS_CATEGORY_LABELS: Record<NewsCategory, string> = {
    earnings: 'Earnings',
    financials: 'Financials',
    dividend: 'Dividend',
    corporate: 'Corporate',
    other: 'Disclosure',
}

export const UPDATES_SECTION_TITLE = 'Updates'
export const UPDATES_SECTION_SUBTITLE =
    'Regulatory filings and disclosures from MSE-listed companies · End-of-day archive — not live news.'

/** @deprecated Use UPDATES_SECTION_TITLE */
export const FILINGS_SECTION_TITLE = UPDATES_SECTION_TITLE
/** @deprecated Use UPDATES_SECTION_SUBTITLE */
export const FILINGS_SECTION_SUBTITLE = UPDATES_SECTION_SUBTITLE
