import { PendingLegalNotice } from '@/components/legal/PendingLegalNotice'
import Link from 'next/link'

export const metadata = {
    title: 'Contact — Talir',
    description: 'Contact Talir',
}

export default function ContactPage() {
    return (
        <article className="max-w-2xl space-y-6">
            <header className="space-y-2">
                <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">Contact</h1>
            </header>

            <PendingLegalNotice page="Contact">
                Contact details (email, postal address, and response expectations) will be published here once
                confirmed.
            </PendingLegalNotice>

            <p className="text-xs">
                <Link href="/" className="text-accent hover:underline">
                    ← Back to home
                </Link>
            </p>
        </article>
    )
}
