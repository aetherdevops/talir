/**
 * Offline reparse of committed OCR cache → dividend fields.
 *
 * Dry-run by default (report only). Pass --write to upsert Supabase extractions.
 *
 * Env:
 *   TALIR_DOCUMENT_STORE=supabase (+ service role) required for --write
 *   TALIR_SCOPE=MBI10|ALL (filters which docs to write; dry-run always all cache)
 */
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()

import fs from 'fs'
import path from 'path'
import {
    DIVIDEND_PARSER_VERSION,
    parseDividendCalendarText,
} from '../lib/dividends'
import {
    hasFieldExtraction,
    isDocumentStoreEnabled,
    saveFieldExtraction,
} from '../lib/document-store'
import { loadOcrCache } from '../lib/document-ocr'
import { getSupabaseAdminOrNull } from '../lib/supabase/admin'
import { isInScope, resolveIngestScope } from '../lib/index-constituents'
import { loadMseSymbolRatiosFile } from '../lib/mse-symbol-ratios'

interface DocRow {
    document_id: number
    stock_code: string
    attachment_ids: number[] | null
    filed_at: string
    profit_year: number | null
}

function wantsWrite(): boolean {
    return process.argv.includes('--write')
}

async function loadDocsByAttachment(): Promise<Map<number, DocRow>> {
    const map = new Map<number, DocRow>()
    const db = getSupabaseAdminOrNull()
    if (!db) return map

    const { data, error } = await db
        .from('seinet_documents')
        .select('document_id, stock_code, attachment_ids, filed_at, profit_year')
        .eq('document_kind', 'dividend_calendar')

    if (error || !data) {
        if (error) console.warn('loadDocsByAttachment:', error.message)
        return map
    }

    for (const row of data as DocRow[]) {
        const ids = Array.isArray(row.attachment_ids) ? row.attachment_ids : []
        for (const id of ids) {
            map.set(Number(id), row)
        }
    }
    return map
}

async function main(): Promise<void> {
    const write = wantsWrite()
    const scope = resolveIngestScope()
    const cache = loadOcrCache()
    const attachmentIds = Object.keys(cache)
    const mseRatios = loadMseSymbolRatiosFile(path.join(process.cwd(), 'lib', 'data'))

    console.log(
        `Reparse OCR cache · parser ${DIVIDEND_PARSER_VERSION} · attachments=${attachmentIds.length} · mode=${write ? 'WRITE' : 'dry-run'} · scope=${scope}`
    )

    if (write && !isDocumentStoreEnabled()) {
        console.error(
            'Document store not enabled. Set TALIR_DOCUMENT_STORE=supabase and Supabase service role env vars.'
        )
        process.exit(1)
    }

    const docsByAtt = write || isDocumentStoreEnabled() ? await loadDocsByAttachment() : new Map()

    let parsed = 0
    let partial = 0
    let linkOnly = 0
    let written = 0
    let skipped = 0
    let unmatched = 0

    const improvements: string[] = []

    for (const attIdStr of attachmentIds) {
        const entry = cache[attIdStr]
        const text = entry?.text ?? ''
        if (text.length < 20) continue

        const doc = docsByAtt.get(Number(attIdStr))
        const stockCode = doc?.stock_code
        if (write && stockCode && !isInScope(stockCode, scope)) {
            skipped++
            continue
        }

        let mseDps: number | null = null
        if (stockCode && mseRatios && doc?.profit_year != null) {
            mseDps =
                mseRatios.byCode[stockCode.toUpperCase()]?.years[String(doc.profit_year)]?.dps ??
                null
        }

        const fields = parseDividendCalendarText(text, {
            fromOcr: true,
            mseDps,
            filedAt: doc?.filed_at ?? null,
        })

        if (fields.parseStatus === 'parsed') parsed++
        else if (fields.parseStatus === 'partial') partial++
        else linkOnly++

        if (
            fields.grossPerShare != null ||
            fields.exDate ||
            fields.paymentStart ||
            fields.paymentEnd
        ) {
            improvements.push(
                `att=${attIdStr} ${stockCode ?? '?'} ${fields.parseStatus} g=${fields.grossPerShare ?? '-'} ex=${fields.exDate ?? '-'} pay=${fields.paymentStart ?? fields.paymentEnd ?? '-'} py=${fields.profitYear ?? doc?.profit_year ?? '-'}`
            )
        }

        if (!write) continue

        if (!doc) {
            unmatched++
            continue
        }

        const force = process.env.TALIR_PARSE_FORCE === '1'
        if (!force && (await hasFieldExtraction(doc.document_id, DIVIDEND_PARSER_VERSION))) {
            skipped++
            continue
        }

        await saveFieldExtraction({
            document_id: doc.document_id,
            parser_version: DIVIDEND_PARSER_VERSION,
            parse_status: fields.parseStatus,
            fields: {
                grossPerShare: fields.grossPerShare,
                cumDate: fields.cumDate,
                exDate: fields.exDate,
                recordDate: fields.recordDate,
                paymentStart: fields.paymentStart,
                paymentEnd: fields.paymentEnd,
                profitYear: fields.profitYear ?? doc.profit_year,
                textSource: 'ocr',
                attachmentId: Number(attIdStr),
            },
        })
        written++
    }

    console.log(
        `Reparse done: parsed=${parsed} partial=${partial} link_only=${linkOnly}` +
            (write ? ` written=${written} skipped=${skipped} unmatchedAtt=${unmatched}` : '')
    )

    const preview = improvements.slice(0, 30)
    for (const line of preview) console.log(' ', line)
    if (improvements.length > preview.length) {
        console.log(`  … +${improvements.length - preview.length} more with fields`)
    }

    const outPath = path.join(process.cwd(), 'lib', 'data', 'derived_dividend_reparse.json')
    if (process.env.TALIR_REPARSE_SAVE === '1') {
        fs.writeFileSync(
            outPath,
            JSON.stringify(
                {
                    generatedAt: new Date().toISOString(),
                    parserVersion: DIVIDEND_PARSER_VERSION,
                    mode: write ? 'write' : 'dry-run',
                    counts: { parsed, partial, linkOnly, written, skipped, unmatched },
                    sample: improvements.slice(0, 100),
                },
                null,
                2
            )
        )
        console.log(`Wrote ${outPath}`)
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
