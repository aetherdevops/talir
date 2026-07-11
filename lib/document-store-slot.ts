import type { DocumentKind } from './document-store'

export type ReportPeriod =
    | 'q1_pl'
    | 'q3_pl'
    | 'h1_fs'
    | 'fy_interim'
    | 'fy_audited'

export interface SlotDocumentRow {
    document_id: number
    filed_at: string
    is_current: boolean
}

export interface SlotKey {
    stock_code: string
    document_kind: DocumentKind
    profit_year: number | null
    fiscal_year: number | null
    report_period: ReportPeriod | null
}

/** Pick which document should be current for a logical slot (latest filed_at wins). */
export function pickCurrentDocumentId(
    rows: SlotDocumentRow[],
    incoming: { document_id: number; filed_at: string }
): number {
    const candidates = [...rows.filter((r) => r.is_current), incoming]
    candidates.sort((a, b) => {
        const dateCmp = b.filed_at.localeCompare(a.filed_at)
        if (dateCmp !== 0) return dateCmp
        return b.document_id - a.document_id
    })
    return candidates[0]!.document_id
}

export function documentsToSupersede(
    rows: SlotDocumentRow[],
    currentDocumentId: number
): number[] {
    return rows
        .filter((r) => r.is_current && r.document_id !== currentDocumentId)
        .map((r) => r.document_id)
}

export function slotKeyEquals(a: SlotKey, b: SlotKey): boolean {
    return (
        a.stock_code === b.stock_code &&
        a.document_kind === b.document_kind &&
        a.profit_year === b.profit_year &&
        a.fiscal_year === b.fiscal_year &&
        a.report_period === b.report_period
    )
}

export function buildSlotKey(input: {
    stock_code: string
    document_kind: DocumentKind
    profit_year?: number | null
    fiscal_year?: number | null
    report_period?: ReportPeriod | null
}): SlotKey {
    return {
        stock_code: input.stock_code,
        document_kind: input.document_kind,
        profit_year: input.profit_year ?? null,
        fiscal_year: input.fiscal_year ?? null,
        report_period: input.report_period ?? null,
    }
}
