'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientIfConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const redirect = searchParams.get('redirect') || '/'
    const initialError = searchParams.get('error')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(
        initialError === 'auth_callback_failed' ? 'Authentication failed. Please try again.' : ''
    )
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError('')

        const supabase = createClientIfConfigured()
        if (!supabase) {
            setLoading(false)
            setError('Authentication is not configured.')
            return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        setLoading(false)

        if (signInError) {
            setError(signInError.message)
            return
        }

        router.push(redirect)
        router.refresh()
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-text-primary mb-2">Sign in</h1>
                <p className="text-sm text-text-secondary mb-6">
                    Access your alerts, portfolios, and watchlists from any device.
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@example.com"
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Your password"
                        />
                    </div>

                    {error && <p className="text-sm text-red-500">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </Button>
                </form>

                <p className="text-sm text-text-secondary mt-6 text-center">
                    No account yet?{' '}
                    <Link href="/register" className="text-brand-500 hover:underline">
                        Create one
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="max-w-md mx-auto mt-12 text-text-secondary">Loading...</div>}>
            <LoginForm />
        </Suspense>
    )
}
