/**
 * Ingest quarterly / H1 / FY-interim P&L filings into Supabase (OCR for scans).
 *
 * TALIR_SCOPE=MBI10|ALL
 * TALIR_OCR_RESULTS=1
 * TALIR_DOCUMENT_STORE=supabase
 * TALIR_PARSE_FORCE=1 — re-parse even when extraction exists
 */
import fs from 'fs'
import path from 'path'
import { loadEnvLocal } from '../lib/load-env-local'
import { isInScope, resolveIngestScope } from '../lib/index-constituents'

loadEnvLocal()
import {
    RESULTS_PARSER_VERSION,
    isAnnualFundamentalTitle,
    parseFundamentalText,
} from '../lib/fundamentals'
import {
    classifyReportKind,
    inferPeriodYear,
    isResultsReport,
    parseReportPeriod,
    type ResultsReportKind,
} from '../lib/results-calendar'
import { isDividendCalendarTitle } from '../lib/dividends'
import {
    applySlotSupersession,
    buildSlotKey,
    hasFieldExtraction,
    isDocumentStoreEnabled,
    saveFieldExtraction,
    updateDocumentSlotYears,
    upsertSeinetDocument,
    type ReportPeriod,
} from '../lib/document-store'
import {
    ISSUER_REPORT_LINK_LAYOUT_CODE,
    fetchDividendDocumentText,
    fetchSeinetDocumentAttachmentIds,
    fetchSeinetDocumentRaw,
    parseDocumentIdFromUrl,
} from '../lib/seinet-document'
import { parseReportDate } from '../lib/news-dates'

const dataDir = path.join(process.cwd(), 'lib', 'data')
const issuersPath = path.join(dataDir, 'issuers.json')

const QUARTERLY_KINDS = new Set<ResultsReportKind>(['q1_pl', 'q3_pl', 'h1_fs', 'fy_interim'])

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

interface ResultsIngestEntry {
    stockCode: string
    stockName: string
    title: string
    url: string
    filedAt: string
    fiscalYear: number
    reportPeriod: ReportPeriod
}

function normalizeUrl(url: string | undefined): string | null {
    if (!url?.trim()) return null
    const trimmed = url.trim()
    if (trimmed.startsWith('http')) return trimmed
    return `https://${trimmed}`
}

function toReportPeriod(kind: ResultsReportKind): ReportPeriod | null {
    if (kind === 'fy_audited') return null
    if (QUARTERLY_KINDS.has(kind)) return kind
    return null
}

function collectFromIssuers(issuers: IssuerRow[]): ResultsIngestEntry[] {
    const byKey = new Map<string, ResultsIngestEntry>()

    for (const issuer of issuers) {
        for (const link of issuer.reportLinks ?? []) {
            if (isDividendCalendarTitle(link.title)) continue
            if (isAnnualFundamentalTitle(link.title)) continue
            if (!isResultsReport(link.title)) continue

            const url = normalizeUrl(link.url)
            const filedAt = parseReportDate(link.title, link.date)
            if (!url || !filedAt) continue

            const period = parseReportPeriod(link.title)
            const reportKind = classifyReportKind(link.title, period?.endMonth ?? null)
            const reportPeriod = toReportPeriod(reportKind)
            if (!reportPeriod) continue

            let fiscalYear: number | null = null
            if (period) {
                fiscalYear = inferPeriodYear(period.endMonth, period.endDay, filedAt)
            } else {
                fiscalYear = Number(filedAt.slice(0, 4))
            }
            if (!fiscalYear) continue

            const key = `${issuer.code}:${reportPeriod}:${fiscalYear}`
            const existing = byKey.get(key)
            if (existing && existing.filedAt >= filedAt) continue

            byKey.set(key, {
                stockCode: issuer.code,
                stockName: issuer.name,
                title: link.title,
                url,
                filedAt,
                fiscalYear,
                reportPeriod,
            })
        }
    }

    return Array.from(byKey.values())
}

async function resolveLayoutCode(documentId: number): Promise<string> {
    const raw = await fetchSeinetDocumentRaw(documentId)
    const code = raw?.layout?.layoutCode?.trim()
    return code || ISSUER_REPORT_LINK_LAYOUT_CODE
}

async function ingestEntry(entry: ResultsIngestEntry): Promise<'skipped' | 'ingested' | 'failed'> {
    const documentId = parseDocumentIdFromUrl(entry.url)
    if (!documentId) return 'failed'

    const force = process.env.TALIR_PARSE_FORCE === '1'
    if (!force && (await hasFieldExtraction(documentId, RESULTS_PARSER_VERSION))) {
        return 'skipped'
    }

    const layoutCode = await resolveLayoutCode(documentId)
    const attachmentIds = await fetchSeinetDocumentAttachmentIds(entry.url)
    const allowOcr = process.env.TALIR_OCR_RESULTS === '1'

    const result = await fetchDividendDocumentText(entry.url, {
        allowOcr,
        documentId,
    })

    if (!result) {
        await upsertSeinetDocument({
            document_id: documentId,
            stock_code: entry.stockCode,
            layout_code: layoutCode,
            document_kind: 'quarterly_pl',
            filed_at: entry.filedAt,
            title: entry.title,
            url: entry.url,
            fiscal_year: entry.fiscalYear,
            report_period: entry.reportPeriod,
            attachment_ids: attachmentIds,
        })
        return 'failed'
    }

    const fields = parseFundamentalText(result.text)

    await upsertSeinetDocument({
        document_id: documentId,
        stock_code: entry.stockCode,
        layout_code: layoutCode,
        document_kind: 'quarterly_pl',
        filed_at: entry.filedAt,
        title: entry.title,
        url: entry.url,
        fiscal_year: entry.fiscalYear,
        report_period: entry.reportPeriod,
        attachment_ids: attachmentIds,
    })

    await saveFieldExtraction({
        document_id: documentId,
        parser_version: RESULTS_PARSER_VERSION,
        parse_status: fields.parseStatus,
        fields: {
            eps: fields.eps,
            netProfit: fields.netProfit,
            reportPeriod: entry.reportPeriod,
            textSource: result.source,
        },
    })

    await updateDocumentSlotYears(documentId, null, entry.fiscalYear, entry.reportPeriod)
    await applySlotSupersession(
        buildSlotKey({
            stock_code: entry.stockCode,
            document_kind: 'quarterly_pl',
            fiscal_year: entry.fiscalYear,
            report_period: entry.reportPeriod,
        }),
        { document_id: documentId, filed_at: entry.filedAt }
    )

    return 'ingested'
}

async function main(): Promise<void> {
    if (!isDocumentStoreEnabled()) {
        console.error(
            'Document store not enabled. Set TALIR_DOCUMENT_STORE=supabase and Supabase service role env vars.'
        )
        process.exit(1)
    }

    if (!fs.existsSync(issuersPath)) {
        console.error(`Missing ${issuersPath}. Run npm run script:issuers first.`)
        process.exit(1)
    }

    const scope = resolveIngestScope()
    const issuers = JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as IssuerRow[]
    const entries = collectFromIssuers(issuers).filter((e) => isInScope(e.stockCode, scope))

    console.log(`Ingest results — scope: ${scope}, ${entries.length} filings, parser: ${RESULTS_PARSER_VERSION}`)

    let ingested = 0
    let skipped = 0
    let failed = 0

    for (const entry of entries) {
        const outcome = await ingestEntry(entry)
        if (outcome === 'ingested') ingested++
        else if (outcome === 'skipped') skipped++
        else failed++
    }

    console.log(`Results ingest: ${ingested} ingested, ${skipped} skipped, ${failed} failed`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
