'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getSupabaseAdminOrNull } from '@/lib/supabase/admin'
import { isAdminEmail } from '@/lib/admin'
import type { DividendParseStatus } from '@/lib/dividends'

export type DividendOverrideFields = {
    grossPerShare: number | null
    cumDate: string | null
    exDate: string | null
    recordDate: string | null
    paymentStart: string | null
    paymentEnd: string | null
    parseStatus: DividendParseStatus
}

export type DividendOverrideView = {
    stockCode: string
    profitYear: number
    fields: DividendOverrideFields
    updatedBy: string | null
    updatedAt: string | null
}

async function requireAdmin(): Promise<{ email: string } | { error: string }> {
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        if (!user?.email) return { error: 'Sign in required.' }
        if (!isAdminEmail(user.email)) return { error: 'Not an admin user.' }
        return { email: user.email }
    } catch {
        return { error: 'Authentication is not configured.' }
    }
}

export async function listDividendOverridesAction(): Promise<{
    overrides: DividendOverrideView[]
    error?: string
}> {
    const auth = await requireAdmin()
    if ('error' in auth) return { overrides: [], error: auth.error }

    const db = getSupabaseAdminOrNull()
    if (!db) return { overrides: [], error: 'Service role not configured.' }

    const { data, error } = await db
        .from('dividend_overrides')
        .select('stock_code, profit_year, fields, updated_by, updated_at')
        .order('stock_code')
        .order('profit_year', { ascending: false })

    if (error) return { overrides: [], error: error.message }

    return {
        overrides: (data ?? []).map((row) => ({
            stockCode: row.stock_code as string,
            profitYear: row.profit_year as number,
            fields: normalizeFields(row.fields),
            updatedBy: (row.updated_by as string) ?? null,
            updatedAt: (row.updated_at as string) ?? null,
        })),
    }
}

function normalizeFields(raw: unknown): DividendOverrideFields {
    const f = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>
    return {
        grossPerShare: typeof f.grossPerShare === 'number' ? f.grossPerShare : null,
        cumDate: typeof f.cumDate === 'string' ? f.cumDate : null,
        exDate: typeof f.exDate === 'string' ? f.exDate : null,
        recordDate: typeof f.recordDate === 'string' ? f.recordDate : null,
        paymentStart: typeof f.paymentStart === 'string' ? f.paymentStart : null,
        paymentEnd: typeof f.paymentEnd === 'string' ? f.paymentEnd : null,
        parseStatus:
            f.parseStatus === 'parsed' || f.parseStatus === 'partial' || f.parseStatus === 'link_only'
                ? f.parseStatus
                : 'partial',
    }
}

function emptyToNull(value: string): string | null {
    const t = value.trim()
    return t ? t : null
}

export async function upsertDividendOverrideAction(input: {
    stockCode: string
    profitYear: number
    grossPerShare: string
    cumDate: string
    exDate: string
    recordDate: string
    paymentStart: string
    paymentEnd: string
    parseStatus: DividendParseStatus
}): Promise<{ ok: boolean; error?: string }> {
    const auth = await requireAdmin()
    if ('error' in auth) return { ok: false, error: auth.error }

    const db = getSupabaseAdminOrNull()
    if (!db) return { ok: false, error: 'Service role not configured.' }

    const stockCode = input.stockCode.trim().toUpperCase()
    const profitYear = Number(input.profitYear)
    if (!stockCode || !Number.isInteger(profitYear) || profitYear < 2000 || profitYear > 2100) {
        return { ok: false, error: 'Invalid stock code or profit year.' }
    }

    const grossRaw = input.grossPerShare.trim()
    let grossPerShare: number | null = null
    if (grossRaw) {
        const n = Number(grossRaw.replace(',', '.'))
        if (!Number.isFinite(n) || n <= 0) return { ok: false, error: 'Invalid gross DPS.' }
        grossPerShare = n
    }

    const fields: DividendOverrideFields = {
        grossPerShare,
        cumDate: emptyToNull(input.cumDate),
        exDate: emptyToNull(input.exDate),
        recordDate: emptyToNull(input.recordDate),
        paymentStart: emptyToNull(input.paymentStart),
        paymentEnd: emptyToNull(input.paymentEnd),
        parseStatus: input.parseStatus,
    }

    const { error } = await db.from('dividend_overrides').upsert(
        {
            stock_code: stockCode,
            profit_year: profitYear,
            fields,
            updated_by: auth.email,
            updated_at: new Date().toISOString(),
        },
        { onConflict: 'stock_code,profit_year' }
    )

    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin/dividends')
    revalidatePath('/en/admin/dividends')
    return { ok: true }
}

export async function deleteDividendOverrideAction(input: {
    stockCode: string
    profitYear: number
}): Promise<{ ok: boolean; error?: string }> {
    const auth = await requireAdmin()
    if ('error' in auth) return { ok: false, error: auth.error }

    const db = getSupabaseAdminOrNull()
    if (!db) return { ok: false, error: 'Service role not configured.' }

    const { error } = await db
        .from('dividend_overrides')
        .delete()
        .eq('stock_code', input.stockCode.toUpperCase())
        .eq('profit_year', input.profitYear)

    if (error) return { ok: false, error: error.message }

    revalidatePath('/admin/dividends')
    revalidatePath('/en/admin/dividends')
    return { ok: true }
}
