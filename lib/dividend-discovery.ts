import fs from 'fs'
import path from 'path'
import { parseReportDate } from './news-dates'
import { isDividendCalendarTitle, type DividendCalendarEntry } from './dividends'
import {
    parseDocumentIdFromUrl,
    walkDividendCalendarChain,
    type SeinetCalendarMeta,
} from './seinet-document'

export interface ReportLink {
    title: string
    url: string
    date?: string
}

export interface IssuerRow {
    code: string
    name: string
    reportLinks?: ReportLink[]
    disclosureLinks?: ReportLink[]
}

export function normalizeSeinetUrl(url: string | undefined): string | null {
    if (!url?.trim()) return null
    const trimmed = url.trim()
    if (trimmed.startsWith('http')) return trimmed
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    return `https://${trimmed}`
}

export function emptyCalendarFields(): Pick<
    DividendCalendarEntry,
    | 'grossPerShare'
    | 'cumDate'
    | 'exDate'
    | 'recordDate'
    | 'paymentStart'
    | 'paymentEnd'
    | 'parseStatus'
    | 'trailingYieldAtEx'
    | 'yoyGrowthPct'
    | 'profitYear'
    | 'payoutRatioPct'
> {
    return {
        grossPerShare: null,
        cumDate: null,
        exDate: null,
        recordDate: null,
        paymentStart: null,
        paymentEnd: null,
        parseStatus: 'link_only',
        trailingYieldAtEx: null,
        yoyGrowthPct: null,
        profitYear: null,
        payoutRatioPct: null,
    }
}

export function buildDividendEntryFromLink(issuer: IssuerRow, link: ReportLink): DividendCalendarEntry | null {
    if (!isDividendCalendarTitle(link.title)) return null
    const url = normalizeSeinetUrl(link.url)
    const filedAt = parseReportDate(link.title, link.date)
    if (!url || !filedAt) return null

    return {
        stockCode: issuer.code,
        stockName: issuer.name,
        filedAt,
        url,
        ...emptyCalendarFields(),
        source: 'SECNet',
    }
}

export function buildDividendEntryFromChainMeta(
    meta: SeinetCalendarMeta,
    issuerNames: Map<string, string>
): DividendCalendarEntry {
    return {
        stockCode: meta.stockCode,
        stockName: issuerNames.get(meta.stockCode) ?? meta.stockName,
        filedAt: meta.filedAt,
        url: meta.url,
        ...emptyCalendarFields(),
        source: 'SECNet',
    }
}

export function mergeDividendEntries(
    primary: DividendCalendarEntry[],
    extra: DividendCalendarEntry[]
): DividendCalendarEntry[] {
    const byDocId = new Map<string, DividendCalendarEntry>()

    for (const entry of [...primary, ...extra]) {
        const docId = parseDocumentIdFromUrl(entry.url)
        const key = docId ? String(docId) : entry.url.toLowerCase()
        if (!byDocId.has(key)) {
            byDocId.set(key, entry)
        }
    }

    return Array.from(byDocId.values())
}

export function collectDividendCalendarsFromIssuers(issuers: IssuerRow[]): DividendCalendarEntry[] {
    const byUrl = new Map<string, DividendCalendarEntry>()

    for (const issuer of issuers) {
        const links = [...(issuer.reportLinks ?? []), ...(issuer.disclosureLinks ?? [])]
        for (const link of links) {
            const entry = buildDividendEntryFromLink(issuer, link)
            if (!entry) continue
            byUrl.set(entry.url.toLowerCase(), entry)
        }
    }

    return Array.from(byUrl.values())
}

export function collectDividendCalendarsFromNewsFeed(feedPath: string): DividendCalendarEntry[] {
    if (!fs.existsSync(feedPath)) return []
    const feed = JSON.parse(fs.readFileSync(feedPath, 'utf8')) as {
        items: Array<{
            rawTitle?: string
            stockCode: string
            stockName?: string
            url: string
            publishedAt: string | null
        }>
    }

    const entries: DividendCalendarEntry[] = []
    for (const item of feed.items) {
        const rawTitle = item.rawTitle ?? ''
        if (!isDividendCalendarTitle(rawTitle)) continue
        if (!item.publishedAt) continue
        entries.push({
            stockCode: item.stockCode,
            stockName: item.stockName ?? item.stockCode,
            filedAt: item.publishedAt,
            url: item.url,
            ...emptyCalendarFields(),
            source: 'SECNet',
        })
    }
    return entries
}

export async function backfillDividendCalendarsFromLayoutChain(
    seeds: DividendCalendarEntry[],
    issuerNames: Map<string, string>
): Promise<DividendCalendarEntry[]> {
    const startId = seeds
        .map((entry) => parseDocumentIdFromUrl(entry.url))
        .find((id): id is number => id !== null)

    if (!startId) return seeds

    console.log(`Dividend backfill: walking layoutLink chain from document ${startId}…`)
    const chain = await walkDividendCalendarChain(startId)
    const chainEntries = chain.map((meta) => buildDividendEntryFromChainMeta(meta, issuerNames))
    console.log(`Dividend backfill: ${chain.length} calendar documents in SECNet chain`)

    return mergeDividendEntries(seeds, chainEntries)
}

export function loadIssuerRows(issuersPath: string): IssuerRow[] {
    if (!fs.existsSync(issuersPath)) return []
    return JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as IssuerRow[]
}

export function defaultDataPaths() {
    const dataDir = path.join(process.cwd(), 'lib', 'data')
    return {
        dataDir,
        issuersPath: path.join(dataDir, 'issuers.json'),
        feedPath: path.join(dataDir, 'news_feed.json'),
    }
}

export async function discoverAllDividendCalendars(): Promise<{
    entries: DividendCalendarEntry[]
    issuers: IssuerRow[]
    issuerNames: Map<string, string>
}> {
    const { issuersPath, feedPath } = defaultDataPaths()
    const issuers = loadIssuerRows(issuersPath)
    const issuerNames = new Map(issuers.map((issuer) => [issuer.code, issuer.name]))

    let entries = collectDividendCalendarsFromIssuers(issuers)
    if (!entries.length) {
        entries = collectDividendCalendarsFromNewsFeed(feedPath)
    }
    entries = await backfillDividendCalendarsFromLayoutChain(entries, issuerNames)

    return { entries, issuers, issuerNames }
}

export function entryDocKey(url: string): string {
    const docId = parseDocumentIdFromUrl(url)
    return docId ? String(docId) : url.toLowerCase()
}
