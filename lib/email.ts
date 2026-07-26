import { Resend } from 'resend'

let resendClient: Resend | null = null

export const EMAIL_FROM = process.env.RESEND_FROM ?? 'onboarding@resend.dev'

export function isResendConfigured(): boolean {
    const key = process.env.RESEND_API_KEY
    return Boolean(key && key.startsWith('re_') && key !== 're_xxxxxxxxx')
}

export function createResend(): Resend {
    if (resendClient) return resendClient

    const key = process.env.RESEND_API_KEY
    if (!key) {
        throw new Error('Resend client requires RESEND_API_KEY')
    }

    resendClient = new Resend(key)
    return resendClient
}

export function getResendOrNull(): Resend | null {
    if (!isResendConfigured()) return null
    return createResend()
}

export type SendEmailInput = {
    to: string | string[]
    subject: string
    html: string
    from?: string
}

export type SendEmailResult =
    | { ok: true; id: string }
    | { ok: false; error: string }

export async function sendEmail({
    to,
    subject,
    html,
    from = EMAIL_FROM,
}: SendEmailInput): Promise<SendEmailResult> {
    const resend = getResendOrNull()
    if (!resend) {
        return { ok: false, error: 'Email sending is not configured yet.' }
    }

    const { data, error } = await resend.emails.send({ from, to, subject, html })

    if (error) {
        return { ok: false, error: error.message }
    }
    if (!data) {
        return { ok: false, error: 'Resend returned no message id.' }
    }

    return { ok: true, id: data.id }
}
