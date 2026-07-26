import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()

import { sendEmail } from '../lib/email'

async function main() {
    const to = process.argv[2] ?? 'ivan.isailovski@gmail.com'

    const result = await sendEmail({
        to,
        subject: 'Hello World',
        html: '<p>Congrats on sending your <strong>first email</strong>!</p>',
    })

    if (!result.ok) {
        console.error(`Failed to send to ${to}: ${result.error}`)
        process.exit(1)
    }

    console.log(`Sent to ${to} (id ${result.id})`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
