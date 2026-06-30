'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClientIfConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'

export default function AccountPage() {
    const { user, signOut } = useAuth()
    const router = useRouter()

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    if (!user) {
        return (
            <div className="max-w-lg mx-auto py-12 text-center space-y-4">
                <h1 className="text-2xl font-bold text-text-primary">Account</h1>
                <p className="text-text-secondary">Sign in to manage your account.</p>
                <Link href="/login" className="inline-flex">
                    <Button>Sign in</Button>
                </Link>
            </div>
        )
    }

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault()
        setPasswordMsg(null)
        if (password.length < 8) {
            setPasswordMsg('Password must be at least 8 characters.')
            return
        }
        if (password !== confirmPassword) {
            setPasswordMsg('Passwords do not match.')
            return
        }
        setBusy(true)
        const supabase = createClientIfConfigured()
        if (!supabase) {
            setBusy(false)
            setPasswordMsg('Authentication is not configured.')
            return
        }
        const { error } = await supabase.auth.updateUser({ password })
        setBusy(false)
        if (error) {
            setPasswordMsg(error.message)
            return
        }
        setPassword('')
        setConfirmPassword('')
        setPasswordMsg('Password updated.')
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== user.email) {
            setDeleteMsg('Type your email to confirm deletion.')
            return
        }
        if (!confirm('This permanently deletes your account and all synced data. Continue?')) return

        setBusy(true)
        setDeleteMsg(null)
        const supabase = createClientIfConfigured()
        if (!supabase) {
            setBusy(false)
            setDeleteMsg('Authentication is not configured.')
            return
        }
        const { error } = await supabase.rpc('delete_user_account')
        setBusy(false)
        if (error) {
            setDeleteMsg(error.message)
            return
        }
        await signOut()
        router.push('/')
    }

    return (
        <div className="max-w-lg mx-auto py-8 space-y-6">
            <header>
                <Link href="/settings" className="text-sm text-accent hover:underline">← Settings</Link>
                <h1 className="text-3xl font-bold text-text-primary mt-2">Account</h1>
                <p className="text-text-secondary mt-2">Your Talir profile</p>
            </header>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-text-tertiary">Email</p>
                    <p className="text-text-primary font-medium">{user.email}</p>
                </div>
            </div>

            <form onSubmit={handlePasswordChange} className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-text-primary">Change password</h2>
                <input
                    type="password"
                    placeholder="New password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm min-h-[44px]"
                    autoComplete="new-password"
                />
                <input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm min-h-[44px]"
                    autoComplete="new-password"
                />
                {passwordMsg && <p className="text-sm text-text-secondary">{passwordMsg}</p>}
                <Button type="submit" disabled={busy}>Update password</Button>
            </form>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-down">Delete account</h2>
                <p className="text-sm text-text-secondary">Type your email to confirm. This cannot be undone.</p>
                <input
                    type="email"
                    placeholder={user.email ?? ''}
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm min-h-[44px]"
                />
                {deleteMsg && <p className="text-sm text-down">{deleteMsg}</p>}
                <Button variant="secondary" onClick={handleDeleteAccount} disabled={busy} className="text-down border-down/30">
                    Delete my account
                </Button>
            </div>

            <Button variant="ghost" onClick={() => signOut()}>
                Sign out
            </Button>
        </div>
    )
}
