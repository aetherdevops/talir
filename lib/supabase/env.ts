const PLACEHOLDER_PATTERNS = [
    /^your-/i,
    /^YOUR_/,
    /your-project-ref/,
    /your-anon-key/i,
    /^replace-me/i,
    /^changeme/i,
]

function isPlaceholder(value: string) {
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))
}

export function getSupabaseEnv() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim()
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()

    if (!url || !anonKey || isPlaceholder(url) || isPlaceholder(anonKey)) {
        return null
    }

    return { url, anonKey }
}

export function isSupabaseConfigured() {
    return getSupabaseEnv() !== null
}
