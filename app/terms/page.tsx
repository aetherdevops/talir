import { PendingLegalNotice } from '@/components/legal/PendingLegalNotice'
import Link from 'next/link'

export const metadata = {
    title: 'Terms — Talir',
    description: 'Talir terms of use',
}

export default function TermsPage() {
    return (
        <article className="max-w-2xl space-y-6">
            <header className="space-y-2">
                <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">Terms of use</h1>
            </header>

            <PendingLegalNotice page="Terms">
                Terms of use (governing law, liability, acceptable use, and account terms) are not yet published. Do
                not treat this page as a legal document.
            </PendingLegalNotice>

            <p className="text-xs">
                <Link href="/" className="text-accent hover:underline">
                    ← Back to home
                </Link>
            </p>
        </article>
    )
}
