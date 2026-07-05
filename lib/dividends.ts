import { formatNewsDate } from './utils'

export const DIVIDEND_PARSER_VERSION = '1.1.0'

/** Max plausible gross DPS for MSE ordinary shares (den.). Totals often exceed this. */
const MAX_PLAUSIBLE_GROSS_PER_SHARE = 50_000

export type DividendParseStatus = 'parsed' | 'partial' | 'link_only'

export interface DividendCalendarEntry {
    stockCode: string
    stockName: string
    filedAt: string
    url: string
    grossPerShare: number | null
    cumDate: string | null
    exDate: string | null
    recordDate: string | null
    paymentStart: string | null
    paymentEnd: string | null
    parseStatus: DividendParseStatus
    source: 'SECNet'
    /** Gross per share ÷ EOD close on ex-date (%). Parsed entries only. */
    trailingYieldAtEx: number | null
    /** YoY change vs prior parsed calendar for same issuer (%). Parsed entries only. */
    yoyGrowthPct: number | null
    /** Profit year the dividend relates to (e.g. 2025 dividend approved in 2026). */
    profitYear: number | null
    /** DPS ÷ EPS for matching fiscal year (%). Both must be parsed from SECNet. */
    payoutRatioPct: number | null
}

export interface DividendsCalendarFile {
    generatedAt: string
    lastIssuerScan: string | null
    issuerCount: number
    recent: DividendCalendarEntry[]
    all: DividendCalendarEntry[]
    upcomingExDates: DividendCalendarEntry[]
    byIssuer: Record<string, DividendCalendarEntry[]>
}

export interface DisclosureLink {
    title: string
    url: string
    date?: string
}

export function isDividendCalendarTitle(rawTitle: string): boolean {
    return /dividend calendar/i.test(rawTitle)
}

export function isDividendDisclosureTitle(rawTitle: string): boolean {
    const lower = rawTitle.toLowerCase()
    return lower.includes('dividend') || lower.includes('distribution of profit')
}

function parseEuDateToIso(value: string): string | null {
    const eu = value.match(/(\d{1,2})\.(\d{1,2})\.(\d{4})/)
    if (!eu) return null
    const day = Number(eu[1])
    const month = Number(eu[2])
    const year = Number(eu[3])
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

/** Parse MKD amounts: 2,571 · 1,350.00 · 1.350,00 · 150 denars · 150 денари */
export function parseAmountMk(value: string): number | null {
    const normalized = value.replace(/\s+/g, ' ').trim()
    const match = normalized.match(/(\d{1,3}(?:[.,\s]\d{3})*(?:[.,]\d+)?|\d+(?:[.,]\d+)?)/)
    if (!match) return null

    let raw = match[1].replace(/\s/g, '')

    if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(raw)) {
        // European thousands: 1.350,00
        raw = raw.replace(/\./g, '').replace(',', '.')
    } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
        // US thousands: 2,571 or 1,350.00
        raw = raw.replace(/,/g, '')
    } else if (/^\d+,\d+$/.test(raw)) {
        raw = raw.replace(',', '.')
    } else {
        raw = raw.replace(/\.(?=\d{3})/g, '').replace(',', '.')
    }

    const num = Number(raw)
    return Number.isFinite(num) && num > 0 ? num : null
}

function looksLikeTotalDividendAmount(text: string, amount: number): boolean {
    if (amount <= MAX_PLAUSIBLE_GROSS_PER_SHARE) return false
    return /вкупен|total|износ од \d[\d.,\s]{5,}/i.test(text)
}

function sanitizeGrossPerShare(text: string, value: number | null): number | null {
    if (value === null) return null
    if (value < 1 || value > 1_000_000) return null
    if (looksLikeTotalDividendAmount(text, value)) return null
    return value
}

function firstMatch(text: string, patterns: RegExp[]): RegExpMatchArray | null {
    for (const pattern of patterns) {
        const m = text.match(pattern)
        if (m) return m
    }
    return null
}

function isPlausibleIsoDate(value: string | null): boolean {
    if (!value) return false
    const year = Number(value.slice(0, 4))
    return year >= 2000 && year <= 2036
}

/** OCR text is never promoted to parsed; weak partial rows downgrade to link_only. */
export function applyOcrParseCap(
    fields: {
        grossPerShare: number | null
        cumDate: string | null
        exDate: string | null
        recordDate: string | null
        paymentStart: string | null
        paymentEnd: string | null
    },
    fromOcr?: boolean
): DividendParseStatus {
    let status = deriveDividendParseStatus(fields)
    if (!fromOcr) return status

    if (status === 'parsed') status = 'partial'

    if (status === 'partial') {
        if (fields.grossPerShare === null || fields.exDate === null) return 'link_only'
        if (!isPlausibleIsoDate(fields.exDate)) return 'link_only'
        if (fields.grossPerShare < 1 || fields.grossPerShare > 1_000_000) return 'link_only'
    }

    return status
}

export function deriveDividendParseStatus(fields: {
    grossPerShare: number | null
    cumDate: string | null
    exDate: string | null
    recordDate: string | null
    paymentStart: string | null
    paymentEnd: string | null
}): DividendParseStatus {
    const hasAny =
        fields.grossPerShare !== null ||
        fields.cumDate !== null ||
        fields.exDate !== null ||
        fields.recordDate !== null ||
        fields.paymentStart !== null ||
        fields.paymentEnd !== null

    if (!hasAny) return 'link_only'

    const hasParsedCore =
        fields.grossPerShare !== null &&
        fields.exDate !== null &&
        (fields.cumDate !== null || fields.recordDate !== null) &&
        (fields.paymentStart !== null || fields.paymentEnd !== null)

    return hasParsedCore ? 'parsed' : 'partial'
}

export interface ParseDividendCalendarOptions {
    /** OCR-derived text is never promoted to parsed — capped at partial. */
    fromOcr?: boolean
}

/** Parse dividend calendar fields from document body text — never invent missing values. */
export function parseDividendCalendarText(
    text: string,
    options?: ParseDividendCalendarOptions
): Omit<DividendCalendarEntry, 'stockCode' | 'stockName' | 'filedAt' | 'url' | 'source'> {
    const normalized = text.replace(/\s+/g, ' ').trim()

    let grossPerShare: number | null = null
    const grossPatterns = [
        /gross dividend per share is\s*(\d[\d\s.,]*)\s*(?:mkd|den|ден)?/i,
        /gross dividend per share[^0-9]{0,20}(\d[\d\s.,]*)\s*(?:mkd|den|ден|mkd)?/i,
        /gross amount of MKD\s*(\d[\d\s.,]*)\s*per/i,
        /gross amount of mkd\s*(\d[\d\s.,]*)\s*per\s*1?\s*ordinary share/i,
        /gross amount of\s*(\d[\d\s.,]*)\s*(?:mkd|den|ден)\s*per/i,
        /(\d[\d\s.,]*)\s*(?:mkd|den|ден|mkd)\s*per\s*(?:1\s*)?ordinary share/i,
        /бруто-дивиденда по акција[^0-9]{0,40}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        /висината на бруто-дивиденда по акција[^0-9]{0,60}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        /(\d[\d\s.,]*)\s*(?:ден|mkd|денари)\s*бруто/i,
        /бруто[^0-9]{0,30}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        /(\d[\d\s.,]*)\s*денари?\s*по\s*акци/i,
        /износ[^0-9]{0,40}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
    ]
    for (const pattern of grossPatterns) {
        const grossMatch = normalized.match(pattern)
        if (!grossMatch) continue
        const candidate = sanitizeGrossPerShare(normalized, parseAmountMk(grossMatch[1]))
        if (candidate !== null) {
            grossPerShare = candidate
            break
        }
    }

    let cumDate: string | null = null
    const cumMatch = firstMatch(normalized, [
        /last date of trading with right for dividends is\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /last date for trading with dividend right.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /last trading day cum[- ]dividend.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /cum[- ]dividend.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /последен датум на тргување со право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /последен ден на тргување со право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /последен ден.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /со право на дивиденда.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
    ])
    if (cumMatch) cumDate = parseEuDateToIso(cumMatch[1])

    let exDate: string | null = null
    const exMatch = firstMatch(normalized, [
        /first date for trading without dividend right.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /first date of trading without right for dividends is\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /first trading day ex[- ]dividend[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /ex[- ]dividend[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /прв датум на тргување без право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /без право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /прв ден[^0-9]{0,40}(\d{1,2}\.\d{1,2}\.\d{4})/i,
    ])
    if (exMatch) exDate = parseEuDateToIso(exMatch[1])

    let recordDate: string | null = null
    const recordMatch = firstMatch(normalized, [
        /list of the shareholders with right for dividends is determined is\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /recording date for determining the list of shareholders.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /record date[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /datum na evidencija[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /ден на евиденција[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /датум на стекнување на право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /датум на евиденција[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /popis na akcioneri[^0-9]{0,40}(\d{1,2}\.\d{1,2}\.\d{4})/i,
    ])
    if (recordMatch) recordDate = parseEuDateToIso(recordMatch[1])

    let paymentStart: string | null = null
    let paymentEnd: string | null = null
    const payStartMatch = firstMatch(normalized, [
        /dividend payout will start at\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /commencement date for dividend payout.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /payment period[^0-9]{0,20}(\d{1,2}\.\d{1,2}\.\d{4})\s*[-–]\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /исплата на дивидендата[^0-9]{0,40}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /исплата[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /ќе започне од\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
    ])
    if (payStartMatch) {
        paymentStart = parseEuDateToIso(payStartMatch[1])
        if (payStartMatch[2]) paymentEnd = parseEuDateToIso(payStartMatch[2])
    }

    let profitYear: number | null = null
    const profitYearMatch = firstMatch(normalized, [
        /dividend for the year (\d{4})/i,
        /for the year (\d{4})/i,
        /за годината (\d{4})/i,
        /за (\d{4}) година/i,
        /dividend right for the year (\d{4})/i,
        /without dividend right for the year (\d{4})/i,
    ])
    if (profitYearMatch) profitYear = Number(profitYearMatch[1])

    let parseStatus = applyOcrParseCap(
        {
            grossPerShare,
            cumDate,
            exDate,
            recordDate,
            paymentStart,
            paymentEnd,
        },
        options?.fromOcr
    )

    return {
        grossPerShare,
        cumDate,
        exDate,
        recordDate,
        paymentStart,
        paymentEnd,
        parseStatus,
        trailingYieldAtEx: null,
        yoyGrowthPct: null,
        profitYear,
        payoutRatioPct: null,
    }
}

export function formatDividendRowDetail(entry: DividendCalendarEntry): string {
    const parts: string[] = []
    if (entry.profitYear) parts.push(`FY ${entry.profitYear}`)
    if (entry.grossPerShare !== null) {
        parts.push(`${entry.grossPerShare.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} ден.`)
    }
    if (entry.exDate) parts.push(`ex ${formatNewsDate(entry.exDate)}`)
    else if (entry.cumDate) parts.push(`cum ${formatNewsDate(entry.cumDate)}`)
    else if (entry.recordDate) parts.push(`record ${formatNewsDate(entry.recordDate)}`)
    if (entry.parseStatus === 'link_only') parts.push(`filed ${formatNewsDate(entry.filedAt)}`)
    return parts.length ? parts.join(' · ') : `filed ${formatNewsDate(entry.filedAt)}`
}

/** Resolved profit year for charting (parsed field or ex-date year − 1 heuristic). */
export function resolveProfitYear(entry: DividendCalendarEntry): number | null {
    if (entry.profitYear) return entry.profitYear
    if (!entry.exDate) return null
    const exYear = Number(entry.exDate.slice(0, 4))
    const exMonth = Number(entry.exDate.slice(5, 7))
    // MSE AGMs typically ex-div in Q2 for prior FY
    if (exMonth <= 8) return exYear - 1
    return exYear
}

export function nextUpcomingExDividend(
    entries: DividendCalendarEntry[],
    referenceDate = new Date()
): DividendCalendarEntry | null {
    const today = referenceDate.toISOString().split('T')[0]
    return (
        entries
            .filter(
                (e) =>
                    e.exDate &&
                    e.exDate >= today &&
                    e.parseStatus === 'parsed' &&
                    e.grossPerShare !== null
            )
            .sort((a, b) => (a.exDate ?? '').localeCompare(b.exDate ?? ''))[0] ?? null
    )
}

export function buildDividendsCalendarFile(
    entries: DividendCalendarEntry[],
    meta: { lastIssuerScan: string | null; issuerCount: number },
    referenceDate = new Date()
): DividendsCalendarFile {
    const today = referenceDate.toISOString().split('T')[0]
    const sorted = [...entries].sort((a, b) => b.filedAt.localeCompare(a.filedAt))

    const upcomingExDates = sorted.filter(
        (entry) =>
            entry.exDate &&
            entry.exDate >= today &&
            entry.parseStatus !== 'link_only'
    )

    const byIssuer: Record<string, DividendCalendarEntry[]> = {}
    for (const entry of sorted) {
        if (!byIssuer[entry.stockCode]) byIssuer[entry.stockCode] = []
        byIssuer[entry.stockCode].push(entry)
    }
    for (const code of Object.keys(byIssuer)) {
        byIssuer[code].sort((a, b) => {
            const da = a.exDate ?? a.filedAt
            const db = b.exDate ?? b.filedAt
            return db.localeCompare(da)
        })
    }

    return {
        generatedAt: new Date().toISOString(),
        lastIssuerScan: meta.lastIssuerScan,
        issuerCount: meta.issuerCount,
        recent: sorted.slice(0, 30),
        all: sorted,
        upcomingExDates,
        byIssuer,
    }
}

export function earliestParsedYear(entries: DividendCalendarEntry[]): number | null {
    const parsed = entries.filter((e) => e.parseStatus === 'parsed')
    if (!parsed.length) return null
    const years = parsed.map((e) => {
        const d = e.exDate ?? e.filedAt
        return Number(d.slice(0, 4))
    })
    return Math.min(...years)
}

/** Earliest calendar filing year in our dataset (parsed or link-only). */
export function earliestCalendarYear(entries: DividendCalendarEntry[]): number | null {
    if (!entries.length) return null
    const years = entries.map((e) => Number((e.exDate ?? e.filedAt).slice(0, 4)))
    return Math.min(...years)
}

export function countCalendarYears(entries: DividendCalendarEntry[]): number {
    const years = new Set(entries.map((e) => (e.exDate ?? e.filedAt).slice(0, 4)))
    return years.size
}

/** MSE listed issuers overwhelmingly file one dividend calendar per year. */
export function inferPayoutFrequency(): 'annual' {
    return 'annual'
}

/** Calendars filed within the last N calendar years (inclusive). */
export function countCalendarsInLastYears(
    entries: DividendCalendarEntry[],
    years: number,
    referenceDate = new Date()
): number {
    const cutoffYear = referenceDate.getFullYear() - years + 1
    return entries.filter((entry) => {
        const year = Number((entry.exDate ?? entry.filedAt).slice(0, 4))
        return year >= cutoffYear
    }).length
}

export function latestParsedDividend(entries: DividendCalendarEntry[]): DividendCalendarEntry | null {
    return (
        entries
            .filter((e) => e.parseStatus === 'parsed' && e.grossPerShare !== null)
            .sort((a, b) => (b.exDate ?? b.filedAt).localeCompare(a.exDate ?? a.filedAt))[0] ?? null
    )
}

/** Newest calendar with a disclosed gross amount — parsed or partial (for overview stats). */
export function latestDisclosedDividend(entries: DividendCalendarEntry[]): DividendCalendarEntry | null {
    const rank: Record<DividendCalendarEntry['parseStatus'], number> = {
        parsed: 2,
        partial: 1,
        link_only: 0,
    }
    return (
        entries
            .filter(
                (e) =>
                    (e.parseStatus === 'parsed' || e.parseStatus === 'partial') &&
                    e.grossPerShare !== null
            )
            .sort((a, b) => {
                const dateCmp = (b.exDate ?? b.filedAt).localeCompare(a.exDate ?? a.filedAt)
                if (dateCmp !== 0) return dateCmp
                return rank[b.parseStatus] - rank[a.parseStatus]
            })[0] ?? null
    )
}

export interface EodPriceRow {
    date: string
    last_transaction_price: number
}

/** Last EOD close on or before isoDate (history ascending). */
export function findCloseOnOrBefore(history: EodPriceRow[], isoDate: string): number | null {
    if (!history.length) return null
    let close: number | null = null
    for (const row of history) {
        if (row.date > isoDate) break
        if (row.last_transaction_price > 0) close = row.last_transaction_price
    }
    return close
}

export function computeTrailingYieldAtEx(
    grossPerShare: number | null,
    exDate: string | null,
    closeOnEx: number | null
): number | null {
    if (grossPerShare === null || !exDate || closeOnEx === null || closeOnEx <= 0) return null
    return (grossPerShare / closeOnEx) * 100
}

export function computeYoyGrowthPct(
    currentGross: number | null,
    priorGross: number | null
): number | null {
    if (currentGross === null || priorGross === null || priorGross <= 0) return null
    return ((currentGross - priorGross) / priorGross) * 100
}

/** Attach trailing yield and YoY growth to parsed entries (mutates in place). */
export function enrichDividendDerivedMetrics(
    entries: DividendCalendarEntry[],
    getHistory: (stockCode: string) => EodPriceRow[] | null
): void {
    for (const entry of entries) {
        entry.trailingYieldAtEx = null
        entry.yoyGrowthPct = null
        entry.payoutRatioPct = null
    }

    const byCode = new Map<string, DividendCalendarEntry[]>()
    for (const entry of entries) {
        if (!byCode.has(entry.stockCode)) byCode.set(entry.stockCode, [])
        byCode.get(entry.stockCode)!.push(entry)
    }

    for (const [code, issuerEntries] of byCode) {
        const history = getHistory(code)
        const parsed = issuerEntries
            .filter((e) => e.parseStatus === 'parsed' && e.grossPerShare !== null && e.exDate)
            .sort((a, b) => (a.exDate ?? '').localeCompare(b.exDate ?? ''))

        for (let i = 0; i < parsed.length; i++) {
            const entry = parsed[i]
            const close = history ? findCloseOnOrBefore(history, entry.exDate!) : null
            entry.trailingYieldAtEx = computeTrailingYieldAtEx(
                entry.grossPerShare,
                entry.exDate,
                close
            )
            if (i > 0) {
                entry.yoyGrowthPct = computeYoyGrowthPct(
                    entry.grossPerShare,
                    parsed[i - 1].grossPerShare
                )
            }
        }
    }
}

export function highestDisclosedGross(entries: DividendCalendarEntry[], limit = 10): DividendCalendarEntry[] {
    return entries
        .filter((e) => e.parseStatus === 'parsed' && e.grossPerShare !== null)
        .sort((a, b) => (b.grossPerShare ?? 0) - (a.grossPerShare ?? 0))
        .slice(0, limit)
}

export function computePayoutRatioPct(
    grossPerShare: number | null,
    eps: number | null
): number | null {
    if (grossPerShare === null || eps === null || eps <= 0) return null
    return (grossPerShare / eps) * 100
}

/** Join parsed EPS from fundamentals onto dividend entries by stock + profit year. */
export function enrichDividendPayoutRatios(
    entries: DividendCalendarEntry[],
    epsByIssuerYear: Map<string, number>
): void {
    for (const entry of entries) {
        entry.payoutRatioPct = null
        if (entry.parseStatus !== 'parsed' || entry.grossPerShare === null) continue
        const year = resolveProfitYear(entry)
        if (!year) continue
        const eps = epsByIssuerYear.get(`${entry.stockCode}:${year}`)
        if (eps === undefined) continue
        entry.payoutRatioPct = computePayoutRatioPct(entry.grossPerShare, eps)
    }
}

/** Issuers with the most calendar filings in the last N years (filing count proxy). */
export function mostCalendarFilings(
    entries: DividendCalendarEntry[],
    years = 5,
    referenceDate = new Date()
): Array<{ stockCode: string; stockName: string; count: number }> {
    const cutoffYear = referenceDate.getFullYear() - years + 1
    const counts = new Map<string, { stockName: string; count: number }>()

    for (const entry of entries) {
        const year = Number((entry.exDate ?? entry.filedAt).slice(0, 4))
        if (year < cutoffYear) continue
        const row = counts.get(entry.stockCode) ?? { stockName: entry.stockName, count: 0 }
        row.count++
        counts.set(entry.stockCode, row)
    }

    return Array.from(counts.entries())
        .map(([stockCode, { stockName, count }]) => ({ stockCode, stockName, count }))
        .sort((a, b) => b.count - a.count)
}
