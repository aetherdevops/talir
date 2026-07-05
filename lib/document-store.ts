import { createHash } from 'crypto'
import type { DividendParseStatus } from './dividends'
import { getSupabaseAdminOrNull, isSupabaseAdminConfigured } from './supabase/admin'
import {
    buildSlotKey,
    documentsToSupersede,
    pickCurrentDocumentId,
    type SlotKey,
} from './document-store-slot'

export type DocumentKind = 'dividend_calendar' | 'audited_financial' | 'quarterly_pl'

export function isDocumentStoreEnabled(): boolean {
    return process.env.TALIR_DOCUMENT_STORE === 'supabase' && isSupabaseAdminConfigured()
}

export function sha256Buffer(buffer: Buffer): string {
    return createHash('sha256').update(buffer).digest('hex')
}

export interface SeinetDocumentInput {
    document_id: number
    stock_code: string
    layout_code: string
    document_kind: DocumentKind
    filed_at: string
    title?: string | null
    url: string
    profit_year?: number | null
    fiscal_year?: number | null
    attachment_ids: number[]
}

export interface FieldExtractionInput {
    document_id: number
    parser_version: string
    parse_status: DividendParseStatus
    fields: Record<string, unknown>
    parse_errors?: Record<string, unknown> | null
}

export async function upsertSeinetDocument(input: SeinetDocumentInput): Promise<void> {
    if (!isDocumentStoreEnabled()) return
    const db = getSupabaseAdminOrNull()
    if (!db) return

    const { error } = await db.from('seinet_documents').upsert(
        {
            document_id: input.document_id,
            stock_code: input.stock_code,
            layout_code: input.layout_code,
            document_kind: input.document_kind,
            filed_at: input.filed_at,
            title: input.title ?? null,
            url: input.url,
            profit_year: input.profit_year ?? null,
            fiscal_year: input.fiscal_year ?? null,
            attachment_ids: input.attachment_ids,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'document_id' }
    )
    if (error) throw new Error(`upsertSeinetDocument: ${error.message}`)
}

export async function hasFieldExtraction(
    documentId: number,
    parserVersion: string
): Promise<boolean> {
    if (!isDocumentStoreEnabled()) return false
    const db = getSupabaseAdminOrNull()
    if (!db) return false

    const { data, error } = await db
        .from('document_field_extractions')
        .select('id')
        .eq('document_id', documentId)
        .eq('parser_version', parserVersion)
        .maybeSingle()

    if (error) throw new Error(`hasFieldExtraction: ${error.message}`)
    return Boolean(data)
}

export async function saveFieldExtraction(input: FieldExtractionInput): Promise<void> {
    if (!isDocumentStoreEnabled()) return
    const db = getSupabaseAdminOrNull()
    if (!db) return

    const { error } = await db.from('document_field_extractions').upsert(
        {
            document_id: input.document_id,
            parser_version: input.parser_version,
            parse_status: input.parse_status,
            fields: input.fields,
            parse_errors: input.parse_errors ?? null,
            extracted_at: new Date().toISOString(),
        },
        { onConflict: 'document_id,parser_version' }
    )
    if (error) throw new Error(`saveFieldExtraction: ${error.message}`)
}

export async function applySlotSupersession(
    slot: SlotKey,
    incoming: { document_id: number; filed_at: string }
): Promise<void> {
    if (!isDocumentStoreEnabled()) return
    const db = getSupabaseAdminOrNull()
    if (!db) return

    let query = db
        .from('seinet_documents')
        .select('document_id, filed_at, is_current')
        .eq('stock_code', slot.stock_code)
        .eq('document_kind', slot.document_kind)

    if (slot.profit_year !== null) {
        query = query.eq('profit_year', slot.profit_year)
    } else {
        query = query.is('profit_year', null)
    }

    if (slot.fiscal_year !== null) {
        query = query.eq('fiscal_year', slot.fiscal_year)
    } else {
        query = query.is('fiscal_year', null)
    }

    const { data: rows, error } = await query
    if (error) throw new Error(`applySlotSupersession: ${error.message}`)

    const currentId = pickCurrentDocumentId(rows ?? [], incoming)
    const toSupersede = documentsToSupersede(rows ?? [], currentId)

    await db
        .from('seinet_documents')
        .update({ is_current: true, superseded_by: null, updated_at: new Date().toISOString() })
        .eq('document_id', currentId)

    for (const oldId of toSupersede) {
        await db
            .from('seinet_documents')
            .update({
                is_current: false,
                superseded_by: currentId,
                updated_at: new Date().toISOString(),
            })
            .eq('document_id', oldId)
    }
}

export async function updateDocumentSlotYears(
    documentId: number,
    profitYear: number | null,
    fiscalYear: number | null
): Promise<void> {
    if (!isDocumentStoreEnabled()) return
    const db = getSupabaseAdminOrNull()
    if (!db) return

    const { error } = await db
        .from('seinet_documents')
        .update({
            profit_year: profitYear,
            fiscal_year: fiscalYear,
            updated_at: new Date().toISOString(),
        })
        .eq('document_id', documentId)

    if (error) throw new Error(`updateDocumentSlotYears: ${error.message}`)
}

export interface StoredDividendExtraction {
    document_id: number
    stock_code: string
    stock_name: string | null
    filed_at: string
    url: string
    title: string | null
    parse_status: DividendParseStatus
    fields: Record<string, unknown>
}

export async function loadDividendExtractionsFromStore(
    parserVersion: string
): Promise<Map<number, StoredDividendExtraction>> {
    const map = new Map<number, StoredDividendExtraction>()
    if (!isDocumentStoreEnabled()) return map

    const db = getSupabaseAdminOrNull()
    if (!db) return map

    const { data: docs, error: docError } = await db
        .from('seinet_documents')
        .select('document_id, stock_code, filed_at, url, title')
        .eq('document_kind', 'dividend_calendar')
        .eq('is_current', true)

    if (docError) throw new Error(`loadDividendExtractionsFromStore: ${docError.message}`)
    if (!docs?.length) return map

    const docIds = docs.map((d) => d.document_id)
    const { data: fields, error: fieldError } = await db
        .from('document_field_extractions')
        .select('document_id, parse_status, fields')
        .in('document_id', docIds)
        .eq('parser_version', parserVersion)

    if (fieldError) throw new Error(`loadDividendExtractionsFromStore fields: ${fieldError.message}`)

    const fieldByDoc = new Map(
        (fields ?? []).map((f) => [f.document_id as number, f])
    )

    for (const doc of docs) {
        const fieldRow = fieldByDoc.get(doc.document_id)
        if (!fieldRow) continue
        map.set(doc.document_id, {
            document_id: doc.document_id,
            stock_code: doc.stock_code,
            stock_name: null,
            filed_at: doc.filed_at,
            url: doc.url,
            title: doc.title,
            parse_status: fieldRow.parse_status as DividendParseStatus,
            fields: (fieldRow.fields ?? {}) as Record<string, unknown>,
        })
    }

    return map
}

export interface StoredFundamentalExtraction {
    document_id: number
    stock_code: string
    fiscal_year: number
    filed_at: string
    url: string
    parse_status: DividendParseStatus
    fields: Record<string, unknown>
}

export async function loadFundamentalExtractionsFromStore(
    parserVersion: string,
    documentKind: 'audited_financial' | 'quarterly_pl' = 'audited_financial'
): Promise<Map<number, StoredFundamentalExtraction>> {
    const map = new Map<number, StoredFundamentalExtraction>()
    if (!isDocumentStoreEnabled()) return map

    const db = getSupabaseAdminOrNull()
    if (!db) return map

    const { data: docs, error: docError } = await db
        .from('seinet_documents')
        .select('document_id, stock_code, fiscal_year, filed_at, url')
        .eq('document_kind', documentKind)
        .eq('is_current', true)

    if (docError) throw new Error(`loadFundamentalExtractionsFromStore: ${docError.message}`)
    if (!docs?.length) return map

    const docIds = docs.map((d) => d.document_id)
    const { data: fields, error: fieldError } = await db
        .from('document_field_extractions')
        .select('document_id, parse_status, fields')
        .in('document_id', docIds)
        .eq('parser_version', parserVersion)

    if (fieldError) throw new Error(`loadFundamentalExtractionsFromStore fields: ${fieldError.message}`)

    const fieldByDoc = new Map(
        (fields ?? []).map((f) => [f.document_id as number, f])
    )

    for (const doc of docs) {
        const fieldRow = fieldByDoc.get(doc.document_id)
        if (!fieldRow || doc.fiscal_year == null) continue
        map.set(doc.document_id, {
            document_id: doc.document_id,
            stock_code: doc.stock_code,
            fiscal_year: doc.fiscal_year,
            filed_at: doc.filed_at,
            url: doc.url,
            parse_status: fieldRow.parse_status as DividendParseStatus,
            fields: (fieldRow.fields ?? {}) as Record<string, unknown>,
        })
    }

    return map
}

export { buildSlotKey }
