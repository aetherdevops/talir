import Link from 'next/link'
import { PendingLegalNotice } from '@/components/legal/PendingLegalNotice'

export const metadata = {
    title: 'About — Talir',
    description: 'About Talir — end-of-day Macedonian Stock Exchange data',
}

export default function AboutPage() {
    return (
        <article className="max-w-2xl space-y-6">
            <header className="space-y-2">
                <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">About Talir</h1>
                <p className="text-sm text-text-secondary leading-relaxed">
                    Talir surfaces end-of-day market data and regulatory filings from the Macedonian Stock Exchange
                    and SEInet — not a live news wire.
                </p>
            </header>

            <section className="space-y-3 text-sm text-text-secondary leading-relaxed">
                <p>
                    <span className="text-text-tertiary">Version </span>
                    <span className="font-data text-text-primary">0.1.0</span>
                </p>
                <p>
                    Data is compiled from public MSE listings and issuer disclosure links on SEInet. Figures reflect
                    the last available end-of-day close unless stated otherwise.
                </p>
                <p className="text-xs">
                    Talir is provided for informational purposes only and does not constitute investment advice.
                </p>
            </section>

            <PendingLegalNotice page="About" />

            <p className="text-xs">
                <Link href="/" className="text-accent hover:underline">
                    ← Back to home
                </Link>
            </p>
        </article>
    )
}
