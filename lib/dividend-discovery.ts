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
    // One primary seed is enough when the DOC_10688 chain is contiguous.
    // Fall back to a few more seeds only if the first walk returns nothing.
    const startIds = [
        ...new Set(
            seeds
                .map((entry) => parseDocumentIdFromUrl(entry.url))
                .filter((id): id is number => id !== null)
        ),
    ].slice(0, 5)

    if (!startIds.length) return seeds

    let merged = seeds
    const seenDocs = new Set<number>()

    for (const startId of startIds) {
        if (seenDocs.has(startId)) continue
        console.log(`Dividend backfill: walking layoutLink chain from document ${startId}…`)
        const chain = await walkDividendCalendarChain(startId)
        for (const meta of chain) seenDocs.add(meta.documentId)
        const chainEntries = chain.map((meta) => buildDividendEntryFromChainMeta(meta, issuerNames))
        console.log(`Dividend backfill: +${chain.length} calendar documents from seed ${startId}`)
        merged = mergeDividendEntries(merged, chainEntries)
        // Contiguous chain: stop after a successful walk
        if (chain.length >= 20) break
    }

    console.log(`Dividend backfill: ${seenDocs.size} unique calendar documents in SECNet chain(s)`)
    return merged
}

/**
 * For issuers that have MSE DPS years but no SECnet calendar entry yet,
 * re-walk layout chains starting from any known document of that issuer.
 * Skips when the primary chain already looks complete (many docs, no orphan issuers).
 */
export async function backfillMseOnlyGaps(
    entries: DividendCalendarEntry[],
    issuerNames: Map<string, string>,
    mseOnlyKeys: Array<{ stockCode: string; profitYear: number }>
): Promise<DividendCalendarEntry[]> {
    if (!mseOnlyKeys.length) return []

    const codesWithDocs = new Set(entries.map((e) => e.stockCode.toUpperCase()))
    // Only chase issuers that appear in MSE gaps AND have zero SECnet calendars so far.
    // Year-level gaps for known issuers are usually real (no DOC_10688 filing) — not chain holes.
    const orphanCodes = [
        ...new Set(
            mseOnlyKeys
                .map((k) => k.stockCode.toUpperCase())
                .filter((code) => !codesWithDocs.has(code))
        ),
    ]

    if (!orphanCodes.length) {
        console.log(
            `Dividend mse-only backfill: skipped (${mseOnlyKeys.length} year-gaps, all issuers already in chain)`
        )
        return []
    }

    // Primary DOC_10688 walk already returned a large set — remaining orphans are
    // almost certainly not on the layout chain (preferred shares, delisted, etc.).
    if (entries.length >= 100) {
        console.log(
            `Dividend mse-only backfill: ${orphanCodes.length} orphan issuers not on DOC_10688 chain (${orphanCodes.slice(0, 8).join(',')}) — leave as MSE-only`
        )
        return []
    }

    const seedIds: number[] = []
    for (const entry of entries) {
        const id = parseDocumentIdFromUrl(entry.url)
        if (id != null) seedIds.push(id)
    }
    // Prefer a single seed — chain is market-wide; extra seeds only if first fails.
    const uniqueSeeds = [...new Set(seedIds)].slice(0, 3)
    if (!uniqueSeeds.length) {
        console.log(
            `Dividend mse-only backfill: ${orphanCodes.length} orphan issuers (${orphanCodes.slice(0, 8).join(',')}) but no seeds`
        )
        return []
    }

    let extra: DividendCalendarEntry[] = []
    const seen = new Set(
        entries.map((e) => parseDocumentIdFromUrl(e.url)).filter((id): id is number => id != null)
    )

    for (const startId of uniqueSeeds) {
        const chain = await walkDividendCalendarChain(startId)
        const chainEntries = chain
            .filter((meta) => !seen.has(meta.documentId))
            .map((meta) => {
                seen.add(meta.documentId)
                return buildDividendEntryFromChainMeta(meta, issuerNames)
            })
        extra = mergeDividendEntries(extra, chainEntries)
        if (extra.length) break
    }

    console.log(
        `Dividend mse-only backfill: +${extra.length} docs for orphan issuers ${orphanCodes.slice(0, 8).join(',')}`
    )
    return extra
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
    const { dataDir, issuersPath, feedPath } = defaultDataPaths()
    const issuers = loadIssuerRows(issuersPath)
    const issuerNames = new Map(issuers.map((issuer) => [issuer.code, issuer.name]))

    let entries = collectDividendCalendarsFromIssuers(issuers)
    if (!entries.length) {
        entries = collectDividendCalendarsFromNewsFeed(feedPath)
    }
    entries = await backfillDividendCalendarsFromLayoutChain(entries, issuerNames)

    // Targeted backfill for issuers with MSE DPS years but thin SECnet coverage
    try {
        const { loadMseSymbolRatiosFile } = await import('./mse-symbol-ratios')
        const { resolveProfitYear } = await import('./dividends')
        const mse = loadMseSymbolRatiosFile(dataDir)
        if (mse) {
            const covered = new Set<string>()
            for (const e of entries) {
                const y = resolveProfitYear(e)
                if (y != null) covered.add(`${e.stockCode.toUpperCase()}::${y}`)
            }
            const gaps: Array<{ stockCode: string; profitYear: number }> = []
            for (const [code, issuer] of Object.entries(mse.byCode)) {
                for (const [yearStr, ratios] of Object.entries(issuer.years)) {
                    if (ratios.dps == null) continue
                    const year = Number(yearStr)
                    if (!Number.isInteger(year)) continue
                    const key = `${code.toUpperCase()}::${year}`
                    if (!covered.has(key)) gaps.push({ stockCode: code.toUpperCase(), profitYear: year })
                }
            }
            if (gaps.length) {
                const extra = await backfillMseOnlyGaps(entries, issuerNames, gaps)
                if (extra.length) entries = mergeDividendEntries(entries, extra)
            }
        }
    } catch (err) {
        console.warn('Dividend mse-only backfill skipped:', err)
    }

    return { entries, issuers, issuerNames }
}

export function entryDocKey(url: string): string {
    const docId = parseDocumentIdFromUrl(url)
    return docId ? String(docId) : url.toLowerCase()
}
