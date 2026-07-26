import { Webhook } from 'standardwebhooks'
import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email'
import {
    renderAuthEmail,
    type AuthEmailActionType,
} from '@/lib/email/auth-email-template'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { localizedPath } from '@/lib/i18n/routing'

export const runtime = 'nodejs'

type HookUser = {
    email?: string
    user_metadata?: Record<string, unknown>
}

type HookEmailData = {
    token?: string
    token_hash?: string
    redirect_to?: string
    email_action_type?: string
    site_url?: string
}

const ALLOWED_TYPES = new Set<AuthEmailActionType>([
    'signup',
    'invite',
    'magiclink',
    'recovery',
    'email_change',
    'email',
])

function getSiteUrl(): string {
    const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim()
    if (raw) return raw.replace(/\/$/, '')
    return 'https://www.talir.mk'
}

function resolveLocale(user: HookUser): Locale {
    const meta = user.user_metadata?.locale
    if (typeof meta === 'string' && isLocale(meta)) return meta
    return 'mk'
}

function resolveActionType(raw: string | undefined): AuthEmailActionType {
    if (raw && ALLOWED_TYPES.has(raw as AuthEmailActionType)) {
        return raw as AuthEmailActionType
    }
    return 'signup'
}

function hookSecret(): string | null {
    const raw = process.env.SEND_EMAIL_HOOK_SECRET?.trim()
    if (!raw) return null
    return raw.replace(/^v1,whsec_/, '')
}

export async function POST(request: Request) {
    const secret = hookSecret()
    if (!secret) {
        return NextResponse.json(
            { error: { http_code: 500, message: 'Send email hook is not configured.' } },
            { status: 500 }
        )
    }

    const payload = await request.text()
    const headers = Object.fromEntries(request.headers)

    let user: HookUser
    let email_data: HookEmailData

    try {
        const wh = new Webhook(secret)
        const verified = wh.verify(payload, headers) as {
            user: HookUser
            email_data: HookEmailData
        }
        user = verified.user
        email_data = verified.email_data
    } catch {
        return NextResponse.json(
            { error: { http_code: 401, message: 'Invalid webhook signature.' } },
            { status: 401 }
        )
    }

    const email = user.email?.trim()
    const tokenHash = email_data.token_hash?.trim()
    if (!email || !tokenHash) {
        return NextResponse.json(
            { error: { http_code: 400, message: 'Missing email or token_hash.' } },
            { status: 400 }
        )
    }

    const locale = resolveLocale(user)
    const actionType = resolveActionType(email_data.email_action_type)
    const siteUrl = getSiteUrl()
    const nextPath =
        actionType === 'recovery'
            ? localizedPath('/set-password', locale)
            : localizedPath('/welcome', locale)
    const confirmUrl = new URL('/auth/confirm', siteUrl)
    confirmUrl.searchParams.set('token_hash', tokenHash)
    confirmUrl.searchParams.set('type', actionType)
    confirmUrl.searchParams.set('next', nextPath)

    const rendered = renderAuthEmail({
        type: actionType,
        locale,
        confirmUrl: confirmUrl.toString(),
        token: email_data.token,
        siteUrl,
    })

    const result = await sendEmail({
        to: email,
        subject: rendered.subject,
        html: rendered.html,
    })

    if (!result.ok) {
        return NextResponse.json(
            { error: { http_code: 500, message: result.error } },
            { status: 500 }
        )
    }

    return NextResponse.json({})
}
