import fs from 'fs'
import path from 'path'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { adminMbi10Codes, isAdminEmail } from '@/lib/admin'
import { listDividendOverridesAction } from '@/lib/admin-dividends-actions'
import { DividendOverridesEditor } from '@/components/admin/DividendOverridesEditor'
import type { DividendCalendarEntry } from '@/lib/dividends'
import { resolveProfitYear } from '@/lib/dividends'

export const dynamic = 'force-dynamic'

function loadDerivedRows() {
    const filePath = path.join(process.cwd(), 'lib', 'data', 'derived_dividends.json')
    if (!fs.existsSync(filePath)) return []
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as {
            all?: DividendCalendarEntry[]
        }
        return (raw.all ?? []).map((e) => ({
            stockCode: e.stockCode,
            profitYear: resolveProfitYear(e),
            grossPerShare: e.grossPerShare,
            cumDate: e.cumDate,
            exDate: e.exDate,
            recordDate: e.recordDate,
            paymentStart: e.paymentStart,
            paymentEnd: e.paymentEnd,
            parseStatus: e.parseStatus,
            source: e.source,
        }))
    } catch {
        return []
    }
}

export default async function AdminDividendsPage() {
    let email: string | null = null
    try {
        const supabase = await createClient()
        const {
            data: { user },
        } = await supabase.auth.getUser()
        email = user?.email ?? null
    } catch {
        email = null
    }

    if (!email) {
        redirect('/login?redirect=/admin/dividends')
    }
    if (!isAdminEmail(email)) {
        return (
            <div className="mx-auto max-w-lg space-y-4 py-12 text-center">
                <h1
                    className="text-2xl font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--talir-serif)', letterSpacing: '-0.015em' }}
                >
                    Admin
                </h1>
                <p className="text-[var(--text-muted)]">
                    Your account is signed in but not on the admin allowlist
                    (TALIR_ADMIN_EMAILS).
                </p>
                <Link href="/" className="text-[var(--accent)] underline">
                    Back home
                </Link>
            </div>
        )
    }

    const { overrides, error } = await listDividendOverridesAction()
    const codes = adminMbi10Codes()
    const derivedRows = loadDerivedRows().filter((r) =>
        codes.includes(r.stockCode.toUpperCase())
    )

    return (
        <div className="mx-auto max-w-4xl space-y-6 px-4 py-8">
            <header className="space-y-2">
                <p className="font-[family-name:var(--talir-mono)] text-[10px] uppercase tracking-[0.32em] text-[var(--text-muted)]">
                    Internal · {email}
                </p>
                <h1
                    className="text-3xl font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--talir-serif)', letterSpacing: '-0.015em' }}
                >
                    Dividend overrides
                </h1>
                <p className="max-w-2xl text-sm text-[var(--text-muted)]">
                    Correct DPS and calendar dates when SECnet/MSE parses are wrong. Overrides win
                    on the next <code className="font-[family-name:var(--talir-mono)]">generate:dividends</code>{' '}
                    run.
                </p>
                {error && (
                    <p className="text-sm text-[var(--down)]" role="alert">
                        {error} — apply migration 007 if the table is missing (
                        <code className="font-[family-name:var(--talir-mono)]">npm run db:apply</code>
                        ).
                    </p>
                )}
            </header>
            <DividendOverridesEditor
                codes={codes}
                derivedRows={derivedRows}
                initialOverrides={overrides}
            />
        </div>
    )
}
