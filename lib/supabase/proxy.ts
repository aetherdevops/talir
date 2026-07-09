import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { getSupabaseEnv } from './env'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'
import { internalPath, parsePathname } from '@/lib/i18n/routing'

function shouldSkipLocale(pathname: string): boolean {
    return (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/auth') ||
        pathname === '/favicon.ico' ||
        pathname === '/manifest.json' ||
        /\.[a-zA-Z0-9]+$/.test(pathname)
    )
}

async function applySupabaseSession(
    request: NextRequest,
    response: NextResponse
): Promise<NextResponse> {
    const env = getSupabaseEnv()
    if (!env) return response

    const supabase = createServerClient(env.url, env.anonKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll()
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options)
                )
            },
        },
    })

    await supabase.auth.getUser()
    return response
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl

    if (shouldSkipLocale(pathname)) {
        return applySupabaseSession(request, NextResponse.next({ request }))
    }

    const segments = pathname.split('/').filter(Boolean)
    const first = segments[0]

    if (first === defaultLocale) {
        const barePath = `/${segments.slice(1).join('/')}` || '/'
        return applySupabaseSession(
            request,
            NextResponse.redirect(new URL(barePath, request.url))
        )
    }

    let locale: Locale = defaultLocale
    let barePath = pathname

    if (first && isLocale(first)) {
        locale = first
        barePath = `/${segments.slice(1).join('/')}` || '/'
    } else {
        const parsed = parsePathname(pathname)
        locale = parsed.locale
        barePath = parsed.pathname
    }

    const url = request.nextUrl.clone()
    url.pathname = internalPath(barePath, locale)

    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-locale', locale)

    let response: NextResponse

    if (first && isLocale(first)) {
        response = NextResponse.next({ request: { headers: requestHeaders } })
    } else {
        response = NextResponse.rewrite(url, { request: { headers: requestHeaders } })
    }

    return applySupabaseSession(request, response)
}
