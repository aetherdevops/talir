import { NextResponse } from 'next/server'
import { getSupabaseAdminOrNull } from '@/lib/supabase/admin'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: Request) {
    try {
        const body = (await request.json()) as { email?: string }
        const email = (body.email ?? '').trim().toLowerCase()

        if (!EMAIL_RE.test(email)) {
            return NextResponse.json({ message: 'Enter a valid email address.' }, { status: 400 })
        }

        const admin = getSupabaseAdminOrNull()
        if (!admin) {
            return NextResponse.json(
                { message: 'Newsletter storage is not configured yet.' },
                { status: 503 }
            )
        }

        const { error } = await admin
            .from('newsletter_subscribers')
            .upsert({ email }, { onConflict: 'email', ignoreDuplicates: false })

        if (error) {
            return NextResponse.json({ message: 'Unable to save subscription right now.' }, { status: 500 })
        }

        return NextResponse.json({ message: 'Thanks. You are subscribed.' })
    } catch {
        return NextResponse.json({ message: 'Invalid request payload.' }, { status: 400 })
    }
}
