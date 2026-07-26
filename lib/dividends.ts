import { formatNewsDate } from './utils'
import { skopjeTodayIso } from './market-session'

export const DIVIDEND_PARSER_VERSION = '1.5.0'

/** Max plausible gross DPS for MSE ordinary shares (den.). Totals often exceed this. */
/** MSE DPS rarely exceeds ~5k (e.g. MPT); 5-digit OCR slips (36667) must not pass. */
const MAX_PLAUSIBLE_GROSS_PER_SHARE = 10_000

export type DividendParseStatus = 'parsed' | 'partial' | 'link_only'

export type DividendFieldSource = 'SECNet' | 'MSE' | 'manual'

export interface DividendSourceFields {
    grossPerShare?: DividendFieldSource
}

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
    source: DividendFieldSource
    /** Field-level provenance; dates default to entry.source when absent. */
    sourceFields?: DividendSourceFields
    /** Synthetic MSE/manual row with no real SECNet filing. */
    isSynthetic?: boolean
    /** Gross per share ÷ EOD close on ex-date (%). Requires analytics core (gross + ex). */
    trailingYieldAtEx: number | null
    /** YoY change vs prior analytics-core calendar for same issuer (%). */
    yoyGrowthPct: number | null
    /** Profit year the dividend relates to (e.g. 2025 dividend approved in 2026). */
    profitYear: number | null
    /** DPS ÷ EPS for matching fiscal year (%). */
    payoutRatioPct: number | null
}

/** Gross DPS + ex-date — enough for yield / upcoming / streak analytics. */
export function hasAnalyticsCore(entry: DividendCalendarEntry): boolean {
    return entry.grossPerShare !== null && entry.exDate !== null
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

/**
 * Normalize noisy MK OCR before dividend regexes (Latin lookalikes, broken words).
 * Safe for native PDF/HTML text — only expands synonyms / collapses whitespace.
 */
export function normalizeOcrDividendText(text: string): string {
    let out = text.replace(/\s+/g, ' ').trim()

    const replacements: Array<[RegExp, string]> = [
        [/\bDEN\b/gi, 'ден'],
        [/\bDEH\b/gi, 'ден'],
        [/\bMKD\b/gi, 'mkd'],
        [/дeн/gi, 'ден'],
        [/дeнари/gi, 'денари'],
        [/дeнар/gi, 'денар'],
        [/бpyто/gi, 'бруто'],
        [/бpуто/gi, 'бруто'],
        [/бругo/gi, 'бруто'],
        [/бруто-/gi, 'бруто-'],
        [/бруто\s*[-–]?\s*дивиденда/gi, 'бруто-дивиденда'],
        [/дuвиденд/gi, 'дивиденд'],
        [/дuвиденда/gi, 'дивиденда'],
        [/дивuденда/gi, 'дивиденда'],
        [/дивидeнда/gi, 'дивиденда'],
        [/дивидендa/gi, 'дивиденда'],
        [/акциja/gi, 'акција'],
        [/акциjа/gi, 'акција'],
        [/тргувaње/gi, 'тргување'],
        [/тргувaнje/gi, 'тргување'],
        [/пpаво/gi, 'право'],
        [/пpaво/gi, 'право'],
        [/KOHUAP|KOHYAP|КОНЦАР/gi, 'кончар'],
        [/изнeсува/gi, 'изнесува'],
        [/изнecува/gi, 'изнесува'],
        [/исплaта/gi, 'исплата'],
        [/исплaтата/gi, 'исплатата'],
        [/запoчне/gi, 'започне'],
        [/извршu/gi, 'изврши'],
        [/гoдина/gi, 'година'],
        [/дeловн/gi, 'деловн'],
        // Cyrillic/Latin digit lookalikes adjacent to amounts
        [/([^\d])О(\d)/g, '$10$2'],
        [/(\d)О([^\d])/g, '$10$2'],
        [/([^\d])З(\d)/g, '$13$2'],
        [/(\d)З([^\d])/g, '$13$2'],
    ]
    for (const [pattern, replacement] of replacements) {
        out = out.replace(pattern, replacement)
    }

    return out.replace(/\s+/g, ' ').trim()
}

/** True when OCR DPS matches MSE Fin.Ratios DPS within ±1% (or ±0.01 abs for tiny DPS). */
export function matchesMseDps(grossPerShare: number | null, mseDps: number | null | undefined): boolean {
    if (grossPerShare == null || mseDps == null || mseDps <= 0) return false
    const tol = Math.max(Math.abs(mseDps) * 0.01, 0.01)
    return Math.abs(grossPerShare - mseDps) <= tol
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
    // Prefer dotted/comma decimals before thousand-group parsing so TEL DPS
    // like 28.9250940552 is not truncated into fake European thousands.
    const match = normalized.match(/(\d+(?:[.,]\d+)+|\d{1,3}(?:[.,\s]\d{3})+(?:[.,]\d+)?|\d+)/)
    if (!match) return null

    let raw = match[1].replace(/\s/g, '')

    if (/^\d{1,3}(\.\d{3}){2,}(,\d+)?$/.test(raw) || /^\d{1,3}(\.\d{3})+,\d+$/.test(raw)) {
        // European thousands: 1.234.567 or 1.350,00
        raw = raw.replace(/\./g, '').replace(',', '.')
    } else if (/^\d{2},\d{3}$/.test(raw)) {
        // OCR often turns EU decimal "55,56" into "55,556". Prefer XX.YY for DPS —
        // not US thousands (would invent 55,556 ден.). Round the 3-digit frac form.
        const n = Number(raw.replace(',', '.'))
        raw = String(Math.round(n * 100) / 100)
    } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(raw)) {
        // US thousands: 2,571 or 1,350.00
        raw = raw.replace(/,/g, '')
    } else if (/^\d+,\d+$/.test(raw)) {
        raw = raw.replace(',', '.')
    } else if (/^\d+\.\d{4,}$/.test(raw)) {
        // Long English decimal DPS (TEL SA Resolution: 28.9250940552)
    } else if (/^\d{1,3}(\.\d{3})+$/.test(raw)) {
        // Multi-group MK thousands: 1.234.567 → already handled above when {2,}
        // Single group X.YYY: 1-digit int → thousands (4.620 → 4620 Makpetrol);
        // 2+ digit int → decimal DPS (12.500 → 12.5) — avoid inventing 12500.
        if (/^\d\.\d{3}$/.test(raw)) {
            raw = raw.replace(/\./g, '')
        }
        // else leave as decimal string for Number()
    } else if (/^\d+\.\d+$/.test(raw)) {
        // Short plain decimal (28.93, 4.62)
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
    if (value < 1 || value > MAX_PLAUSIBLE_GROSS_PER_SHARE) return null
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

function hasPlausibleCoreDate(fields: {
    cumDate: string | null
    exDate: string | null
    recordDate: string | null
}): boolean {
    return (
        isPlausibleIsoDate(fields.exDate) ||
        isPlausibleIsoDate(fields.cumDate) ||
        isPlausibleIsoDate(fields.recordDate)
    )
}

export interface OcrParseCapOptions {
    /** MSE Fin.Ratios DPS for the profit year — enables controlled OCR → parsed promotion. */
    mseDps?: number | null
    /** Admin override / manual confirmation — allows OCR → parsed without MSE match. */
    adminConfirmed?: boolean
}

/**
 * OCR text is capped at partial unless full calendar fields are present AND
 * DPS matches MSE Fin.Ratios (±1%) or adminConfirmed is set.
 * Partial requires gross DPS plus at least one of ex / cum / record.
 */
export function applyOcrParseCap(
    fields: {
        grossPerShare: number | null
        cumDate: string | null
        exDate: string | null
        recordDate: string | null
        paymentStart: string | null
        paymentEnd: string | null
    },
    fromOcr?: boolean,
    options?: OcrParseCapOptions
): DividendParseStatus {
    let status = deriveDividendParseStatus(fields)
    if (!fromOcr) return status

    if (status === 'parsed') {
        const allowParsed =
            matchesMseDps(fields.grossPerShare, options?.mseDps) || Boolean(options?.adminConfirmed)
        if (!allowParsed) status = 'partial'
    }

    if (status === 'partial') {
        if (fields.grossPerShare === null) return 'link_only'
        if (!hasPlausibleCoreDate(fields)) return 'link_only'
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
    /**
     * OCR-derived text is capped at partial unless mseDps matches or adminConfirmed.
     * See applyOcrParseCap.
     */
    fromOcr?: boolean
    mseDps?: number | null
    adminConfirmed?: boolean
    /** Filing date — used as profitYear fallback (filedAt year − 1) when text lacks year. */
    filedAt?: string | null
}

function matchLooksLikePerShare(match: RegExpMatchArray, text: string): boolean {
    const start = Math.max(0, (match.index ?? 0) - 48)
    const end = Math.min(text.length, (match.index ?? 0) + match[0].length + 48)
    return /per\s+share|по\s*акци|по\s+една\s+акци|за\s+една\s+акци/i.test(text.slice(start, end))
}

function matchLooksLikeNominalValue(match: RegExpMatchArray, text: string): boolean {
    const start = Math.max(0, (match.index ?? 0) - 64)
    return /номинал/i.test(text.slice(start, (match.index ?? 0) + match[0].length))
}

/**
 * Pick gross DPS from candidate regexes.
 * Prefer matches whose context says "per share" / "по акција" so TEL's
 * "total gross amount of MKD 2,494,931,182" never wins over per-share DPS.
 */
function extractGrossPerShare(normalized: string): number | null {
    // TEL / Makedonski Telekom English SA Resolution template (DOC_10688 scans):
    // "The gross amount of the dividend per share shall be MKD 28.925…"
    // Keep these ahead of bare "gross amount of MKD <total>" patterns.
    const perShareFirst: RegExp[] = [
        /gross amount of (?:the )?dividend per share(?:\s+shall)?(?:\s+be|\s+is|\s+amounts?\s+to)?\s*(?:MKD|ден\.?|den\.?)?\s*(\d[\d\s.,]*)/i,
        /(?:gross\s+)?dividend per share(?:\s+shall)?(?:\s+be|\s+is|\s+amounts?\s+to)?\s*(?:MKD|ден\.?|den\.?)?\s*(\d[\d\s.,]*)/i,
        /gross dividend per share is\s*(\d[\d\s.,]*)\s*(?:mkd|den|ден)?/i,
        /gross dividend per share[^0-9]{0,20}(\d[\d\s.,]*)\s*(?:mkd|den|ден|mkd)?/i,
        /gross amount of MKD\s*(\d[\d\s.,]*)\s*per/i,
        /gross amount of mkd\s*(\d[\d\s.,]*)\s*per\s*1?\s*ordinary share/i,
        /gross amount of\s*(\d[\d\s.,]*)\s*(?:mkd|den|ден)\s*per/i,
        /(\d[\d\s.,]*)\s*(?:mkd|den|ден|mkd)\s*per\s*(?:1\s*)?ordinary share/i,
        // ALK English resolution: "720,00 Denars per share gross"
        /(\d[\d\s.,]*)\s*Denars?\s+per\s+share\s+gross/i,
        /per\s+share\s+net\s+or\s+(\d[\d\s.,]*)\s*Denars?\s+per\s+share\s+gross/i,
        // TTK: "Висината на бруто-дивиденда по акција ќе изнесува 87,00 денари"
        // (must beat later "43 денари бруто" cash/share split legs)
        /висината на бруто[- ]?дивиденда по акција.{0,40}?(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        /бруто[- ]?дивиденда по акција.{0,40}?(?:изнесува|е)\s*(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        // STB preferred-share calendars: "бруто износ од денари 6,00 по акција"
        /бруто\s+износ\s+од\s+(?:денари|ден\.?|mkd|MEA|МЕД)?\s*(\d[\d\s.,]*)\s*по\s*акци/i,
        /(?:денари|ден\.?|mkd)\s*(\d[\d\s.,]*)\s*по\s*акци/i,
        // ALK / MPT: "320,00 денари бруто, за една акција" / "4.620 денари бруто за една акција"
        /(\d[\d\s.,]*)\s*(?:денари|ден\.?|mkd)\s*бруто(?:\s*,)?\s*за\s+една\s+акци/i,
        /(\d[\d\s.,]*)\s*(?:денари|ден\.?|mkd)\s*бруто(?!\s*[-–]?\s*дивиденда\s+во)/i,
        /бруто-дивиденда по акција[^0-9]{0,40}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        /бруто[- ]?дивиденда[^0-9]{0,50}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        /(\d[\d\s.,]*)\s*денари?\s*по\s*акци/i,
        /по\s*акци[аја][^0-9]{0,40}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
    ]
    const fallback: RegExp[] = [
        /(\d[\d\s.,]*)\s*(?:ден|mkd|денари)\s*бруто/i,
        /бруто[^0-9]{0,30}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        /изнесува[^0-9]{0,20}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        /износ[^0-9]{0,40}(\d[\d\s.,]*)\s*(?:ден|mkd|денари)/i,
        // OCR noise: "320,00 den бруто" / "130 ден. бруто"
        /(\d[\d\s.,]*)\s*(?:ден\.?|den\.?|mkd)\s*(?:бруто|bruto)/i,
    ]

    for (const pattern of perShareFirst) {
        const grossMatch = normalized.match(pattern)
        if (!grossMatch) continue
        if (matchLooksLikeNominalValue(grossMatch, normalized)) continue
        if (!matchLooksLikePerShare(grossMatch, normalized) && /gross amount of\s*(?:MKD|mkd)/i.test(grossMatch[0])) {
            // Bare "gross amount of MKD <n> per …" still OK when "per" is in the match.
            if (!/\bper\b/i.test(grossMatch[0])) continue
        }
        const candidate = sanitizeGrossPerShare(normalized, parseAmountMk(grossMatch[1]))
        if (candidate !== null) return candidate
    }

    for (const pattern of fallback) {
        const grossMatch = normalized.match(pattern)
        if (!grossMatch) continue
        if (matchLooksLikeNominalValue(grossMatch, normalized)) continue
        const candidate = sanitizeGrossPerShare(normalized, parseAmountMk(grossMatch[1]))
        if (candidate !== null) return candidate
    }

    return null
}

/** Parse dividend calendar fields from document body text — never invent missing values. */
export function parseDividendCalendarText(
    text: string,
    options?: ParseDividendCalendarOptions
): Omit<DividendCalendarEntry, 'stockCode' | 'stockName' | 'filedAt' | 'url' | 'source'> {
    const normalized = normalizeOcrDividendText(text)

    const grossPerShare = extractGrossPerShare(normalized)

    let cumDate: string | null = null
    const cumMatch = firstMatch(normalized, [
        // TEL EN SA Resolution: "… with the right to dividend for the Year 2025 shall be 01.07.2026"
        // Allow digits in the gap — "Year 2025" sits between the phrase and the date.
        /last day of trading with the right to dividend.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /last date of trading with the right to dividend.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /Last day of trading with the right to dividend.{0,100}?shall be\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /last date of trading with right for dividends is\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /last date for trading with dividend right.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /last trading day cum[- ]dividend.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /cum[- ]dividend.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /последен датум на тргување со право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /последен ден на тргување со право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /последен датум[^0-9]{0,80}со право[^0-9]{0,40}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /последен ден.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /со право на дивиденда.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /со право[^0-9]{0,60}(\d{1,2}\.\d{1,2}\.\d{4})/i,
    ])
    if (cumMatch) cumDate = parseEuDateToIso(cumMatch[1])

    let exDate: string | null = null
    const exMatch = firstMatch(normalized, [
        // TEL EN SA Resolution: "… without the right to dividend for the Year 2025 shall be 02.07.2026"
        /first day of trading without the right to dividend.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /first date of trading without the right to dividend.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /first date for trading without dividend right.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /first date of trading without right for dividends is\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /first trading day ex[- ]dividend[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /ex[- ]dividend[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /прв датум на тргување без право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /без право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /без право[^0-9]{0,60}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /прв датум[^0-9]{0,80}без право[^0-9]{0,40}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /прв ден[^0-9]{0,40}(\d{1,2}\.\d{1,2}\.\d{4})/i,
    ])
    if (exMatch) exDate = parseEuDateToIso(exMatch[1])

    let recordDate: string | null = null
    const recordMatch = firstMatch(normalized, [
        // TEL EN SA Resolution: "recording date … for the Year 2025 is determined, shall be 03.07.2026"
        // ALK EN: "The day of acquiring the right to dividend for 2025 shall be 16.04.2026"
        /day of acquiring the right to dividend.{0,80}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /recording date.{0,160}?shall be\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /recording date.{0,160}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /list of the shareholders with right for dividends is determined is\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /recording date for determining the list of shareholders.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /record date[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /datum na evidencija[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /ден на евиденција[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        // STB: "Датум на евиденција … е 15.06.2022 година"
        /датум на евиденција.{0,120}?е\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        // MPT: "датум на пресек … се утврдува 16.6.2026"
        /датум на пресек.{0,200}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /датум на стекнување на право на дивиденда.{0,100}?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /датум на евиденција[^0-9]{0,30}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /стекнување[^0-9]{0,60}(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /popis na akcioneri[^0-9]{0,40}(\d{1,2}\.\d{1,2}\.\d{4})/i,
    ])
    if (recordMatch) recordDate = parseEuDateToIso(recordMatch[1])

    let paymentStart: string | null = null
    let paymentEnd: string | null = null
    const payStartMatch = firstMatch(normalized, [
        /dividend payout will start at\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /commencement date for dividend payout.*?(\d{1,2}\.\d{1,2}\.\d{4})/i,
        // ALK EN: "Payment of the dividend for 2025 shall commence on 13.05.2026"
        /payment of the dividend.{0,80}?shall commence on\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /shall commence on\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /payment period[^0-9]{0,20}(\d{1,2}\.\d{1,2}\.\d{4})\s*[-–]\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /payment of dividends?.{0,60}?(\d{1,2}\.\d{1,2}\.\d{4})\s*[-–]\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /dividend will be paid (?:from|starting)\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /исплата на дивидендата.{0,40}?започне\s+од\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /исплатата на дивидендата?.{0,60}?започне\s+од\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /ќе започне од\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /започн[еа]\s+(?:од|на)\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /период на исплата[^0-9]{0,20}(\d{1,2}\.\d{1,2}\.\d{4})\s*[-–]\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        /започне[^0-9]{0,20}(\d{1,2}\.\d{1,2}\.\d{4})/i,
    ])
    if (payStartMatch) {
        paymentStart = parseEuDateToIso(payStartMatch[1])
        if (payStartMatch[2]) paymentEnd = parseEuDateToIso(payStartMatch[2])
    }
    // TEL EN SA Resolution: "payment of the dividend for the Year 2025 shall be effectuated up to 30.09.2026"
    if (!paymentEnd) {
        const payByMatch = firstMatch(normalized, [
            /payment of the dividend.{0,100}?effectuated\s+(?:up\s+to|by)\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
            /(?:shall be )?effectuated\s+(?:up\s+to|by)\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
            /payment.{0,40}?(?:up to|until|by)\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
            // MPT: "Исплатата на дивиденда ќе се изврши до 30.9.2026"
            /исплатата на дивиденда.{0,40}?изврши\s+до\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
            /исплата.{0,40}?до\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
            /изврши\s+до\s*(\d{1,2}\.\d{1,2}\.\d{4})/i,
        ])
        if (payByMatch) paymentEnd = parseEuDateToIso(payByMatch[1])
    }

    let profitYear: number | null = null
    const profitYearMatch = firstMatch(normalized, [
        /dividend for the year (\d{4})/i,
        /for the [Yy]ear (\d{4})/i,
        /profit for the year (\d{4})/i,
        /financial year (\d{4})/i,
        /за годината (\d{4})/i,
        /за (\d{4}) година/i,
        /дивиденда за (\d{4})/i,
        /дивиденда од добивката за (\d{4})/i,
        /добивка(?:та)? за (\d{4})/i,
        /деловн(?:ата)? година (\d{4})/i,
        /за деловната година (\d{4})/i,
        /dividend right for the year (\d{4})/i,
        /without dividend right for the year (\d{4})/i,
        /Year (\d{4})/i,
    ])
    if (profitYearMatch) {
        const y = Number(profitYearMatch[1])
        if (y >= 2000 && y <= 2036) profitYear = y
    }

    // Fallback: explicit "деловна година" / "business year" without digits → filedAt − 1
    if (
        profitYear == null &&
        options?.filedAt &&
        /деловн(?:ата)?\s+година|business\s+year|financial\s+year|добивка(?:та)?\s+за\s+година/i.test(
            normalized
        )
    ) {
        const filedYear = Number(String(options.filedAt).slice(0, 4))
        if (filedYear >= 2001 && filedYear <= 2036) profitYear = filedYear - 1
    }

    let parseStatus = applyOcrParseCap(
        {
            grossPerShare,
            cumDate,
            exDate,
            recordDate,
            paymentStart,
            paymentEnd,
        },
        options?.fromOcr,
        {
            mseDps: options?.mseDps,
            adminConfirmed: options?.adminConfirmed,
        }
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
    const today = skopjeTodayIso(referenceDate)
    return (
        entries
            .filter((e) => hasAnalyticsCore(e) && e.exDate! >= today)
            .sort((a, b) => (a.exDate ?? '').localeCompare(b.exDate ?? ''))[0] ?? null
    )
}

function isSyntheticLike(entry: DividendCalendarEntry): boolean {
    if (entry.isSynthetic) return true
    if ((entry.source === 'MSE' || entry.source === 'manual') && /mse\.mk\/en\/symbol/i.test(entry.url)) {
        return true
    }
    return false
}

export function buildDividendsCalendarFile(
    entries: DividendCalendarEntry[],
    meta: { lastIssuerScan: string | null; issuerCount: number },
    referenceDate = new Date()
): DividendsCalendarFile {
    const today = skopjeTodayIso(referenceDate)
    const sorted = [...entries].sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    const realFilings = sorted.filter((e) => !isSyntheticLike(e))

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
        recent: realFilings.slice(0, 30),
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
        if (isSyntheticLike(entry)) return false
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

/** Attach trailing yield and YoY growth to analytics-core entries (mutates in place). */
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
        const eligible = issuerEntries
            .filter((e) => hasAnalyticsCore(e))
            .sort((a, b) => (a.exDate ?? '').localeCompare(b.exDate ?? ''))

        for (let i = 0; i < eligible.length; i++) {
            const entry = eligible[i]
            const close = history ? findCloseOnOrBefore(history, entry.exDate!) : null
            entry.trailingYieldAtEx = computeTrailingYieldAtEx(
                entry.grossPerShare,
                entry.exDate,
                close
            )
            if (i > 0) {
                entry.yoyGrowthPct = computeYoyGrowthPct(
                    entry.grossPerShare,
                    eligible[i - 1].grossPerShare
                )
            }
        }
    }
}

export function highestDisclosedGross(entries: DividendCalendarEntry[], limit = 10): DividendCalendarEntry[] {
    return entries
        .filter(
            (e) =>
                (e.parseStatus === 'parsed' || e.parseStatus === 'partial') &&
                e.grossPerShare !== null
        )
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

/** Join EPS from fundamentals onto dividend entries by stock + profit year. */
export function enrichDividendPayoutRatios(
    entries: DividendCalendarEntry[],
    epsByIssuerYear: Map<string, number>
): void {
    for (const entry of entries) {
        entry.payoutRatioPct = null
        if (entry.grossPerShare === null) continue
        const year = resolveProfitYear(entry)
        if (!year) continue
        const eps = epsByIssuerYear.get(`${entry.stockCode}:${year}`)
        if (eps === undefined) continue
        entry.payoutRatioPct = computePayoutRatioPct(entry.grossPerShare, eps)
    }
}

/** Issuers with the most real calendar filings in the last N years (excludes synthetic). */
export function mostCalendarFilings(
    entries: DividendCalendarEntry[],
    years = 5,
    referenceDate = new Date()
): Array<{ stockCode: string; stockName: string; count: number }> {
    const cutoffYear = referenceDate.getFullYear() - years + 1
    const counts = new Map<string, { stockName: string; count: number }>()

    for (const entry of entries) {
        if (isSyntheticLike(entry)) continue
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
