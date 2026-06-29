'use client'

import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'

export default function AccountPage() {
    const { user, signOut } = useAuth()

    if (!user) {
        return (
            <div className="max-w-lg mx-auto py-12 text-center space-y-4">
                <h1 className="text-2xl font-bold text-text-primary">Account</h1>
                <p className="text-text-secondary">Sign in to manage your account.</p>
                <a href="/login" className="inline-flex">
                    <Button>Sign in</Button>
                </a>
            </div>
        )
    }

    return (
        <div className="max-w-lg mx-auto py-8 space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-text-primary">Account</h1>
                <p className="text-text-secondary mt-2">Your Talir profile</p>
            </header>

            <div className="bg-surface border border-border rounded-xl p-6 space-y-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-text-tertiary">Email</p>
                    <p className="text-text-primary font-medium">{user.email}</p>
                </div>
                <div>
                    <p className="text-xs uppercase tracking-wide text-text-tertiary">User ID</p>
                    <p className="text-text-secondary text-sm break-all">{user.id}</p>
                </div>
            </div>

            <Button variant="secondary" onClick={() => signOut()}>
                Sign out
            </Button>
        </div>
    )
}
