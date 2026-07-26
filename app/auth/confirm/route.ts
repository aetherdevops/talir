import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const ALLOWED_TYPES = new Set([
    'signup',
    'invite',
    'magiclink',
    'recovery',
    'email_change',
    'email',
] as const)

type AllowedOtpType = typeof ALLOWED_TYPES extends Set<infer T> ? T : never

function isAllowedType(value: string): value is AllowedOtpType {
    return (ALLOWED_TYPES as Set<string>).has(value)
}

function safeNextPath(raw: string | null): string {
    if (!raw) return '/'
    if (!raw.startsWith('/')) return '/'
    if (raw.startsWith('//')) return '/'
    return raw
}

export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get('token_hash')
    const typeRaw = searchParams.get('type')
    const next = safeNextPath(searchParams.get('next'))

    if (!token_hash || !typeRaw || !isAllowedType(typeRaw)) {
        return NextResponse.redirect(`${origin}/login?error=verify_failed`)
    }

    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({
        type: typeRaw,
        token_hash,
    })

    if (error) {
        return NextResponse.redirect(`${origin}/login?error=verify_failed`)
    }

    return NextResponse.redirect(`${origin}${next}`)
}
