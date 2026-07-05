/**
 * Prebuild: annual P&L / audited FY fundamentals from issuer SECNet links + layoutLink backfill.
 * Output: lib/data/derived_fundamentals.json
 *
 * Set TALIR_PARSE_FUNDAMENTALS=1 to fetch attachments and parse EPS / net profit.
 * Set TALIR_PARSE_FUNDAMENTAL_YEARS=6 to limit attachment fetches (default 6 fiscal years).
 * Set TALIR_PARSE_ALL_FUNDAMENTALS=1 to parse every row (slow; manual backfill only).
 * Set TALIR_PARSE_FORCE=1 to re-fetch attachments even when prior parse exists.
 */
import fs from 'fs'
import path from 'path'
import { parseReportDate } from '../lib/news-dates'
import {
    buildFundamentalsFile,
    FUNDAMENTAL_PARSER_VERSION,
    inferFiscalYearFromTitle,
    isAnnualFundamentalTitle,
    parseFundamentalText,
    type FundamentalEntry,
} from '../lib/fundamentals'
import {
    isDocumentStoreEnabled,
    loadFundamentalExtractionsFromStore,
} from '../lib/document-store'
import {
    fetchDividendDocumentText,
    parseDocumentIdFromUrl,
    walkAuditedFinancialChain,
    type SeinetFundamentalMeta,
} from '../lib/seinet-document'

const dataDir = path.join(process.cwd(), 'lib', 'data')
const issuersPath = path.join(dataDir, 'issuers.json')
const outPath = path.join(dataDir, 'derived_fundamentals.json')

const AUDITED_TITLE = 'Audited financial statements'

interface ReportLink {
    title: string
    url: string
    date?: string
}

interface IssuerRow {
    code: string
    name: string
    reportLinks?: ReportLink[]
}

function normalizeUrl(url: string | undefined): string | null {
    if (!url?.trim()) return null
    const trimmed = url.trim()
    if (trimmed.startsWith('http')) return trimmed
    return `https://${trimmed}`
}

function buildEntry(
    stockCode: string,
    stockName: string,
    fiscalYear: number,
    filedAt: string,
    url: string
): FundamentalEntry {
    return {
        stockCode,
        stockName,
        fiscalYear,
        filedAt,
        url,
        netProfit: null,
        eps: null,
        parseStatus: 'link_only',
        source: 'SECNet',
    }
}

function collectFromIssuers(issuers: IssuerRow[]): FundamentalEntry[] {
    const byKey = new Map<string, FundamentalEntry>()

    for (const issuer of issuers) {
        for (const link of issuer.reportLinks ?? []) {
            if (!isAnnualFundamentalTitle(link.title)) continue
            const url = normalizeUrl(link.url)
            const filedAt = parseReportDate(link.title, link.date)
            const fiscalYear = filedAt ? inferFiscalYearFromTitle(link.title, filedAt) : null
            if (!url || !filedAt || !fiscalYear) continue

            const key = `${issuer.code}:${fiscalYear}`
            const existing = byKey.get(key)
            if (existing && existing.filedAt >= filedAt) continue

            byKey.set(
                key,
                buildEntry(issuer.code, issuer.name, fiscalYear, filedAt, url)
            )
        }
    }

    return Array.from(byKey.values())
}

function buildEntryFromChainMeta(
    meta: SeinetFundamentalMeta,
    issuerNames: Map<string, string>
): FundamentalEntry | null {
    const fiscalYear = inferFiscalYearFromTitle(AUDITED_TITLE, meta.filedAt)
    if (!fiscalYear) return null

    return buildEntry(
        meta.stockCode,
        issuerNames.get(meta.stockCode) ?? meta.stockName,
        fiscalYear,
        meta.filedAt,
        meta.url
    )
}

function mergeEntries(primary: FundamentalEntry[], extra: FundamentalEntry[]): FundamentalEntry[] {
    const byDocId = new Map<string, FundamentalEntry>()
    const byFyKey = new Map<string, FundamentalEntry>()

    for (const entry of [...primary, ...extra]) {
        const docId = parseDocumentIdFromUrl(entry.url)
        if (docId) byDocId.set(String(docId), entry)

        const fyKey = `${entry.stockCode}:${entry.fiscalYear}`
        const existing = byFyKey.get(fyKey)
        if (!existing || entry.filedAt > existing.filedAt) {
            byFyKey.set(fyKey, entry)
        }
    }

    const merged = new Map<string, FundamentalEntry>()
    for (const entry of byDocId.values()) {
        merged.set(entry.url.toLowerCase(), entry)
    }
    for (const entry of byFyKey.values()) {
        const docId = parseDocumentIdFromUrl(entry.url)
        const key = docId ? String(docId) : entry.url.toLowerCase()
        if (!merged.has(key)) merged.set(key, entry)
    }

    return Array.from(merged.values())
}

async function backfillFromLayoutChain(
    seeds: FundamentalEntry[],
    issuerNames: Map<string, string>,
    issuers: IssuerRow[]
): Promise<FundamentalEntry[]> {
    const auditedSeedIds = new Set<number>()
    for (const issuer of issuers) {
        for (const link of issuer.reportLinks ?? []) {
            if (!/audited financial/i.test(link.title)) continue
            const id = parseDocumentIdFromUrl(normalizeUrl(link.url) ?? '')
            if (id) auditedSeedIds.add(id)
        }
    }

    const startId =
        auditedSeedIds.values().next().value ??
        seeds
            .map((entry) => parseDocumentIdFromUrl(entry.url))
            .find((id): id is number => id !== null)

    if (!startId) return seeds

    console.log(`Fundamentals backfill: walking DOC_10682 chain from document ${startId}…`)
    const chain = await walkAuditedFinancialChain(startId)
    const chainEntries = chain
        .map((meta) => buildEntryFromChainMeta(meta, issuerNames))
        .filter((entry): entry is FundamentalEntry => entry !== null)
    console.log(`Fundamentals backfill: ${chain.length} audited FY documents in SECNet chain`)

    return mergeEntries(seeds, chainEntries)
}

async function mergeFromDocumentStore(entries: FundamentalEntry[]): Promise<number> {
    if (!isDocumentStoreEnabled()) return 0
    const stored = await loadFundamentalExtractionsFromStore(FUNDAMENTAL_PARSER_VERSION)
    let merged = 0

    for (const entry of entries) {
        const docId = parseDocumentIdFromUrl(entry.url)
        if (!docId) continue
        const row = stored.get(docId)
        if (!row) continue
        entry.eps = (row.fields.eps as number | null) ?? null
        entry.netProfit = (row.fields.netProfit as number | null) ?? null
        entry.parseStatus = row.parse_status as FundamentalEntry['parseStatus']
        merged++
    }

    return merged
}

async function enrichWithDocumentParse(entries: FundamentalEntry[]): Promise<void> {
    if (process.env.TALIR_PARSE_FUNDAMENTALS !== '1') return

    const parseAll = process.env.TALIR_PARSE_ALL_FUNDAMENTALS === '1'
    const maxYears = Number(process.env.TALIR_PARSE_FUNDAMENTAL_YEARS ?? 6)
    const minFiscalYear = new Date().getFullYear() - maxYears + 1

    const existingByUrl = new Map<
        string,
        Pick<FundamentalEntry, 'netProfit' | 'eps' | 'parseStatus'>
    >()
    if (fs.existsSync(outPath)) {
        try {
            const prior = JSON.parse(fs.readFileSync(outPath, 'utf8')) as { all: FundamentalEntry[] }
            for (const row of prior.all ?? []) {
                existingByUrl.set(row.url.toLowerCase(), {
                    netProfit: row.netProfit,
                    eps: row.eps,
                    parseStatus: row.parseStatus,
                })
            }
        } catch {
            // ignore corrupt prior file
        }
    }

    const forceReparse = process.env.TALIR_PARSE_FORCE === '1'

    const toParse = parseAll
        ? entries
        : entries.filter((entry) => entry.fiscalYear >= minFiscalYear)

    let parsed = 0
    let partial = 0
    let linkOnly = 0
    let reused = 0
    let attempted = 0

    for (const entry of toParse) {
        if (entry.parseStatus !== 'link_only') {
            if (entry.parseStatus === 'parsed') parsed++
            else if (entry.parseStatus === 'partial') partial++
            reused++
            continue
        }

        const cached = !forceReparse ? existingByUrl.get(entry.url.toLowerCase()) : undefined
        if (cached) {
            Object.assign(entry, cached)
            if (cached.parseStatus === 'parsed') parsed++
            else if (cached.parseStatus === 'partial') partial++
            else linkOnly++
            reused++
            continue
        }

        attempted++
        if (attempted % 25 === 0) {
            console.log(`Fundamentals parse: ${attempted} new attachments fetched…`)
        }

        const result = await fetchDividendDocumentText(entry.url, {
            allowOcr: process.env.TALIR_OCR_FUNDAMENTALS === '1',
            documentId: parseDocumentIdFromUrl(entry.url) ?? undefined,
        })
        if (!result) {
            linkOnly++
            continue
        }

        const fields = parseFundamentalText(result.text)
        Object.assign(entry, fields)

        if (fields.parseStatus === 'parsed') parsed++
        else if (fields.parseStatus === 'partial') partial++
        else linkOnly++
    }

    const skipped = entries.length - toParse.length
    console.log(
        `Fundamentals parse: ${parsed} parsed, ${partial} partial, ${linkOnly} link_only` +
            (reused ? `, ${reused} reused` : '') +
            (skipped ? ` (${skipped} older rows skipped, ${toParse.length} attempted)` : ` (of ${entries.length})`)
    )
}

async function main(): Promise<void> {
    if (!fs.existsSync(issuersPath)) {
        console.error(`Missing ${issuersPath}. Run npm run script:issuers first.`)
        process.exit(1)
    }

    const issuers = JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as IssuerRow[]
    const issuerNames = new Map(issuers.map((issuer) => [issuer.code, issuer.name]))

    let entries = collectFromIssuers(issuers)
    entries = await backfillFromLayoutChain(entries, issuerNames, issuers)

    const knownCodes = new Set(issuers.map((issuer) => issuer.code))
    const beforeFilter = entries.length
    entries = entries.filter((entry) => knownCodes.has(entry.stockCode))
    if (entries.length < beforeFilter) {
        console.log(
            `Fundamentals filter: kept ${entries.length} filings for ${knownCodes.size} scraped issuers (dropped ${beforeFilter - entries.length} delisted/other)`
        )
    }

    const mergedFromStore = await mergeFromDocumentStore(entries)
    if (mergedFromStore > 0) {
        console.log(`Fundamentals store: merged ${mergedFromStore} extractions from Supabase`)
    }

    await enrichWithDocumentParse(entries)

    const payload = buildFundamentalsFile(entries)
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
    console.log(
        `Wrote fundamentals: ${payload.all.length} annual filings, ${Object.keys(payload.byIssuer).length} issuers → ${outPath}`
    )
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
