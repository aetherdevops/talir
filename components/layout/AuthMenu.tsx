'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LogOut, User } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'

export function AuthMenu() {
    const { user, loading, signOut } = useAuth()
    const [open, setOpen] = useState(false)

    if (loading) {
        return (
            <div className="h-9 w-9 rounded-full bg-surface-secondary animate-pulse" />
        )
    }

    if (!user) {
        return (
            <div className="flex items-center gap-2">
                <Link href="/login">
                    <Button variant="ghost" size="sm">Sign in</Button>
                </Link>
                <Link href="/register" className="hidden sm:block">
                    <Button size="sm">Register</Button>
                </Link>
            </div>
        )
    }

    const initial = user.email?.[0]?.toUpperCase() ?? 'U'

    return (
        <div className="relative">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-md hover:ring-2 hover:ring-offset-2 hover:ring-brand-500 transition-all dark:ring-offset-zinc-900"
                aria-label="Account menu"
            >
                {initial}
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl z-50 py-2">
                        <div className="px-4 py-2 border-b border-border">
                            <p className="text-xs text-text-tertiary uppercase tracking-wide">Signed in as</p>
                            <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
                        </div>
                        <Link
                            href="/account"
                            className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
                            onClick={() => setOpen(false)}
                        >
                            <User className="h-4 w-4" />
                            Account
                        </Link>
                        <button
                            type="button"
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary"
                            onClick={async () => {
                                setOpen(false)
                                await signOut()
                            }}
                        >
                            <LogOut className="h-4 w-4" />
                            Sign out
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}
