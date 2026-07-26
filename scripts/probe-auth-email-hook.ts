import { randomUUID } from 'node:crypto'
import { Webhook } from 'standardwebhooks'
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()

async function main() {
    const secretRaw = process.env.SEND_EMAIL_HOOK_SECRET?.trim()
    if (!secretRaw) {
        console.error('Set SEND_EMAIL_HOOK_SECRET in .env.local (v1,whsec_…)')
        process.exit(1)
    }

    const secret = secretRaw.replace(/^v1,whsec_/, '')
    const to = process.argv[2] ?? 'ivan.isailovski@gmail.com'
    const baseUrl = (process.argv[3] ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(
        /\/$/,
        ''
    )
    const locale = process.argv[4] === 'en' ? 'en' : 'mk'

    const payload = JSON.stringify({
        user: {
            id: randomUUID(),
            email: to,
            user_metadata: { locale },
            app_metadata: {},
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_anonymous: false,
        },
        email_data: {
            token: '305805',
            token_hash: `probe_${Date.now().toString(36)}`,
            redirect_to: `${baseUrl}/`,
            email_action_type: 'signup',
            site_url: baseUrl,
            token_new: '',
            token_hash_new: '',
            old_email: '',
            old_phone: '',
            provider: '',
            factor_type: '',
        },
    })

    const msgId = `msg_${randomUUID()}`
    const timestamp = new Date()
    const wh = new Webhook(secret)
    const signature = wh.sign(msgId, timestamp, payload)

    const url = `${baseUrl}/api/auth/send-email-hook`
    console.log(`POSTing signed signup payload to ${url}`)
    console.log(`to=${to} locale=${locale}`)

    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'content-type': 'application/json',
            'webhook-id': msgId,
            'webhook-timestamp': Math.floor(timestamp.getTime() / 1000).toString(),
            'webhook-signature': signature,
        },
        body: payload,
    })

    const body = await res.text()
    if (!res.ok) {
        console.error(`Hook failed (${res.status}): ${body}`)
        process.exit(1)
    }

    console.log(`Hook OK (${res.status}): ${body || '{}'}`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
