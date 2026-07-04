/**
 * Parse filing dates from SECNet/MSE report titles and scraped date fields.
 * Returns ISO date (YYYY-MM-DD) or null — never falls back to "today".
 */

export function parseReportDate(title: string, dateStr?: string): string | null {
    const fromField = normalizeIsoDate(dateStr)
    if (fromField) return fromField

    const fromTitle = extractUsDateFromTitle(title)
    if (fromTitle) return fromTitle

    return null
}

function normalizeIsoDate(value?: string): string | null {
    if (!value?.trim()) return null

    const trimmed = value.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
        return isValidIso(trimmed) ? trimmed : null
    }

    const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (us) {
        return formatIso(Number(us[3]), Number(us[1]), Number(us[2]))
    }

    const eu = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (eu) {
        return formatIso(Number(eu[3]), Number(eu[2]), Number(eu[1]))
    }

    const parsed = new Date(trimmed)
    if (!Number.isNaN(parsed.getTime())) {
        return parsed.toISOString().split('T')[0]
    }

    return null
}

function extractUsDateFromTitle(title: string): string | null {
    const match = title.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (!match) return null
    return formatIso(Number(match[3]), Number(match[1]), Number(match[2]))
}

function formatIso(year: number, month: number, day: number): string | null {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    const iso = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return isValidIso(iso) ? iso : null
}

function isValidIso(iso: string): boolean {
    const [y, m, d] = iso.split('-').map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    return date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d
}
