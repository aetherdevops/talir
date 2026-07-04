import { PendingLegalNotice } from '@/components/legal/PendingLegalNotice'
import Link from 'next/link'

export const metadata = {
    title: 'Privacy — Talir',
    description: 'Talir privacy policy',
}

export default function PrivacyPage() {
    return (
        <article className="max-w-2xl space-y-6">
            <header className="space-y-2">
                <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">Privacy policy</h1>
            </header>

            <PendingLegalNotice page="Privacy">
                A full privacy policy (data collected, cookies, hosting, retention, and your rights) is not yet
                published. Do not treat this page as a legal document.
            </PendingLegalNotice>

            <p className="text-xs">
                <Link href="/" className="text-accent hover:underline">
                    ← Back to home
                </Link>
            </p>
        </article>
    )
}
