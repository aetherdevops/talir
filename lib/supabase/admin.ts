import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let adminClient: SupabaseClient | null = null

export function isSupabaseAdminConfigured(): boolean {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    return Boolean(url && key && !url.includes('your-project') && key !== 'your-service-role-key')
}

export function createSupabaseAdmin(): SupabaseClient {
    if (adminClient) return adminClient

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !key) {
        throw new Error(
            'Supabase admin client requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY'
        )
    }

    adminClient = createClient(url, key, {
        auth: { persistSession: false, autoRefreshToken: false },
    })
    return adminClient
}

export function getSupabaseAdminOrNull(): SupabaseClient | null {
    if (!isSupabaseAdminConfigured()) return null
    return createSupabaseAdmin()
}
