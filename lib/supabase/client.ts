import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from './env'

let browserClient: SupabaseClient | undefined

export function createClient(): SupabaseClient {
    const env = getSupabaseEnv()
    if (!env) {
        throw new Error(
            'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
        )
    }

    if (!browserClient) {
        browserClient = createBrowserClient(env.url, env.anonKey)
    }

    return browserClient
}

export function createClientIfConfigured(): SupabaseClient | null {
    if (!getSupabaseEnv()) return null
    return createClient()
}
