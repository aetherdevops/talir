/**
 * Ingest audited financial statement PDFs into Supabase (OCR for scans).
 *
 * TALIR_SCOPE=MBI10|ALL
 * TALIR_OCR_FUNDAMENTALS=1
 * TALIR_DOCUMENT_STORE=supabase
 */
import fs from 'fs'
import path from 'path'
import { loadEnvLocal } from '../lib/load-env-local'
import { isInScope, resolveIngestScope } from '../lib/index-constituents'

loadEnvLocal()
import {
    FUNDAMENTAL_PARSER_VERSION,
    inferFiscalYearFromTitle,
    isAnnualFundamentalTitle,
    parseFundamentalText,
    type FundamentalEntry,
} from '../lib/fundamentals'
import {
    applySlotSupersession,
    buildSlotKey,
    hasFieldExtraction,
    isDocumentStoreEnabled,
    saveFieldExtraction,
    updateDocumentSlotYears,
    upsertSeinetDocument,
} from '../lib/document-store'
import {
    AUDITED_FINANCIAL_LAYOUT_CODE,
    fetchDividendDocumentText,
    fetchSeinetDocumentAttachmentIds,
    parseDocumentIdFromUrl,
    walkAuditedFinancialChain,
    type SeinetFundamentalMeta,
} from '../lib/seinet-document'
import { parseReportDate } from '../lib/news-dates'

const dataDir = path.join(process.cwd(), 'lib', 'data')
const issuersPath = path.join(dataDir, 'issuers.json')
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

            byKey.set(key, buildEntry(issuer.code, issuer.name, fiscalYear, filedAt, url))
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

async function discoverFundamentals(): Promise<FundamentalEntry[]> {
    const issuers = JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as IssuerRow[]
    const issuerNames = new Map(issuers.map((i) => [i.code, i.name]))
    let entries = collectFromIssuers(issuers)

    const startId = entries
        .map((e) => parseDocumentIdFromUrl(e.url))
        .find((id): id is number => id !== null)

    if (startId) {
        const chain = await walkAuditedFinancialChain(startId)
        const chainEntries = chain
            .map((m) => buildEntryFromChainMeta(m, issuerNames))
            .filter((e): e is FundamentalEntry => e !== null)
        const byUrl = new Map(entries.map((e) => [e.url.toLowerCase(), e]))
        for (const e of chainEntries) byUrl.set(e.url.toLowerCase(), e)
        entries = Array.from(byUrl.values())
    }

    return entries
}

async function ingestEntry(entry: FundamentalEntry, title: string | null): Promise<'skipped' | 'ingested' | 'failed'> {
    const documentId = parseDocumentIdFromUrl(entry.url)
    if (!documentId) return 'failed'

    const force = process.env.TALIR_PARSE_FORCE === '1'
    if (!force && (await hasFieldExtraction(documentId, FUNDAMENTAL_PARSER_VERSION))) {
        await updateDocumentSlotYears(documentId, null, entry.fiscalYear, 'fy_audited')
        await applySlotSupersession(
            buildSlotKey({
                stock_code: entry.stockCode,
                document_kind: 'audited_financial',
                fiscal_year: entry.fiscalYear,
                report_period: 'fy_audited',
            }),
            { document_id: documentId, filed_at: entry.filedAt }
        )
        return 'skipped'
    }

    const attachmentIds = await fetchSeinetDocumentAttachmentIds(entry.url)
    const allowOcr = process.env.TALIR_OCR_FUNDAMENTALS === '1'

    const result = await fetchDividendDocumentText(entry.url, {
        allowOcr,
        documentId,
    })

    if (!result) {
        await upsertSeinetDocument({
            document_id: documentId,
            stock_code: entry.stockCode,
            layout_code: AUDITED_FINANCIAL_LAYOUT_CODE,
            document_kind: 'audited_financial',
            filed_at: entry.filedAt,
            title,
            url: entry.url,
            fiscal_year: entry.fiscalYear,
            report_period: 'fy_audited',
            attachment_ids: attachmentIds,
        })
        return 'failed'
    }

    const fields = parseFundamentalText(result.text)

    await upsertSeinetDocument({
        document_id: documentId,
        stock_code: entry.stockCode,
        layout_code: AUDITED_FINANCIAL_LAYOUT_CODE,
        document_kind: 'audited_financial',
        filed_at: entry.filedAt,
        title,
        url: entry.url,
        fiscal_year: entry.fiscalYear,
        report_period: 'fy_audited',
        attachment_ids: attachmentIds,
    })

    await saveFieldExtraction({
        document_id: documentId,
        parser_version: FUNDAMENTAL_PARSER_VERSION,
        parse_status: fields.parseStatus,
        fields: {
            eps: fields.eps,
            netProfit: fields.netProfit,
            textSource: result.source,
        },
    })

    await updateDocumentSlotYears(documentId, null, entry.fiscalYear, 'fy_audited')
    await applySlotSupersession(
        buildSlotKey({
            stock_code: entry.stockCode,
            document_kind: 'audited_financial',
            fiscal_year: entry.fiscalYear,
            report_period: 'fy_audited',
        }),
        { document_id: documentId, filed_at: entry.filedAt }
    )

    return 'ingested'
}

async function main(): Promise<void> {
    if (!isDocumentStoreEnabled()) {
        console.error('Document store not enabled.')
        process.exit(1)
    }

    if (!fs.existsSync(issuersPath)) {
        console.error(`Missing ${issuersPath}`)
        process.exit(1)
    }

    const scope = resolveIngestScope()
    const issuers = JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as IssuerRow[]
    const titleByUrl = new Map<string, string>()
    for (const issuer of issuers) {
        for (const link of issuer.reportLinks ?? []) {
            if (link.url) titleByUrl.set(link.url.toLowerCase(), link.title)
        }
    }

    const entries = (await discoverFundamentals()).filter((e) => isInScope(e.stockCode, scope))
    console.log(`Ingest fundamentals — scope: ${scope}, ${entries.length} filings`)

    let ingested = 0
    let skipped = 0
    let failed = 0

    for (const entry of entries) {
        const title = titleByUrl.get(entry.url.toLowerCase()) ?? null
        const outcome = await ingestEntry(entry, title)
        if (outcome === 'ingested') ingested++
        else if (outcome === 'skipped') skipped++
        else failed++
    }

    console.log(`Fundamental ingest: ${ingested} ingested, ${skipped} skipped, ${failed} failed`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
