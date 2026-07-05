/**
 * Ingest dividend calendar PDFs/HTML into Supabase document store (OCR for scans).
 *
 * TALIR_SCOPE=MBI10|ALL (default MBI10)
 * TALIR_OCR_DIVIDENDS=1
 * TALIR_DOCUMENT_STORE=supabase
 * TALIR_PARSE_FORCE=1 — re-parse even when text hash unchanged
 * TALIR_OCR_MAX_DOCS=N — cap documents per run (debug)
 */
import { isInScope, resolveIngestScope } from '../lib/index-constituents'
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()
import { discoverAllDividendCalendars } from '../lib/dividend-discovery'
import {
    DIVIDEND_PARSER_VERSION,
    parseDividendCalendarText,
    type DividendCalendarEntry,
} from '../lib/dividends'
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
    DIVIDEND_CALENDAR_LAYOUT_CODE,
    fetchDividendDocumentText,
    fetchSeinetDocumentAttachmentIds,
    parseDocumentIdFromUrl,
} from '../lib/seinet-document'

async function ingestEntry(
    entry: DividendCalendarEntry,
    title: string | null
): Promise<'skipped' | 'ingested' | 'failed'> {
    const documentId = parseDocumentIdFromUrl(entry.url)
    if (!documentId) return 'failed'

    const force = process.env.TALIR_PARSE_FORCE === '1'
    const attachmentIds = await fetchSeinetDocumentAttachmentIds(entry.url)

    if (!force && (await hasFieldExtraction(documentId, DIVIDEND_PARSER_VERSION))) {
        return 'skipped'
    }

    const result = await fetchDividendDocumentText(entry.url, {
        allowOcr: process.env.TALIR_OCR_DIVIDENDS === '1',
        documentId,
    })

    if (!result) {
        await upsertSeinetDocument({
            document_id: documentId,
            stock_code: entry.stockCode,
            layout_code: DIVIDEND_CALENDAR_LAYOUT_CODE,
            document_kind: 'dividend_calendar',
            filed_at: entry.filedAt,
            title,
            url: entry.url,
            attachment_ids: attachmentIds,
        })
        return 'failed'
    }

    const fields = parseDividendCalendarText(result.text, {
        fromOcr: result.source === 'ocr',
    })

    await upsertSeinetDocument({
        document_id: documentId,
        stock_code: entry.stockCode,
        layout_code: DIVIDEND_CALENDAR_LAYOUT_CODE,
        document_kind: 'dividend_calendar',
        filed_at: entry.filedAt,
        title,
        url: entry.url,
        profit_year: fields.profitYear,
        attachment_ids: attachmentIds,
    })

    await saveFieldExtraction({
        document_id: documentId,
        parser_version: DIVIDEND_PARSER_VERSION,
        parse_status: fields.parseStatus,
        fields: {
            grossPerShare: fields.grossPerShare,
            cumDate: fields.cumDate,
            exDate: fields.exDate,
            recordDate: fields.recordDate,
            paymentStart: fields.paymentStart,
            paymentEnd: fields.paymentEnd,
            profitYear: fields.profitYear,
            textSource: result.source,
            attachmentId: result.attachmentId ?? null,
        },
    })

    if (fields.profitYear !== null) {
        await updateDocumentSlotYears(documentId, fields.profitYear, null)
        await applySlotSupersession(
            buildSlotKey({
                stock_code: entry.stockCode,
                document_kind: 'dividend_calendar',
                profit_year: fields.profitYear,
            }),
            { document_id: documentId, filed_at: entry.filedAt }
        )
    }

    return 'ingested'
}

async function main(): Promise<void> {
    if (!isDocumentStoreEnabled()) {
        console.error(
            'Document store not enabled. Set TALIR_DOCUMENT_STORE=supabase and Supabase service role env vars.'
        )
        process.exit(1)
    }

    const scope = resolveIngestScope()
    const maxDocs = process.env.TALIR_OCR_MAX_DOCS
        ? Number(process.env.TALIR_OCR_MAX_DOCS)
        : null

    console.log(`Ingest dividend documents — scope: ${scope}, parser: ${DIVIDEND_PARSER_VERSION}`)

    const { entries, issuers } = await discoverAllDividendCalendars()
    const scoped = entries.filter((e) => isInScope(e.stockCode, scope))

    const titleByUrl = new Map<string, string>()
    for (const issuer of issuers) {
        for (const link of [...(issuer.reportLinks ?? []), ...(issuer.disclosureLinks ?? [])]) {
            if (link.url) titleByUrl.set(link.url.toLowerCase(), link.title)
        }
    }

    let ingested = 0
    let skipped = 0
    let failed = 0
    let processed = 0

    for (const entry of scoped) {
        if (maxDocs !== null && processed >= maxDocs) break
        processed++

        const title = titleByUrl.get(entry.url.toLowerCase()) ?? null
        const outcome = await ingestEntry(entry, title)
        if (outcome === 'ingested') ingested++
        else if (outcome === 'skipped') skipped++
        else failed++

        if (processed % 5 === 0) {
            console.log(`  … processed ${processed}/${scoped.length}`)
        }
    }

    console.log(
        `Dividend ingest done: ${ingested} ingested, ${skipped} skipped, ${failed} failed (${scoped.length} in scope)`
    )
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
