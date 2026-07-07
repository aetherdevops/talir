'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/Button'

interface LoggedOutGrowthPanelProps {
    pageLabel: string
}

export function LoggedOutGrowthPanel({ pageLabel }: LoggedOutGrowthPanelProps) {
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    async function onSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setStatus('loading')
        setMessage('')

        try {
            const res = await fetch('/api/newsletter/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email }),
            })
            const data = (await res.json()) as { message?: string }

            if (!res.ok) {
                throw new Error(data.message ?? 'Failed to subscribe')
            }

            setStatus('success')
            setMessage(data.message ?? 'Subscribed successfully.')
            setEmail('')
        } catch (error) {
            setStatus('error')
            setMessage(error instanceof Error ? error.message : 'Unable to subscribe right now.')
        }
    }

    return (
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4">
            <div className="space-y-1">
                <h2 className="text-base font-heading font-bold text-text-primary">Create your My Talir account</h2>
                <p className="text-sm text-text-secondary">
                    Save {pageLabel}, sync across devices, and unlock full My Talir tools.
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <Link href="/register">
                    <Button className="min-h-[44px]">Register free</Button>
                </Link>
                <Link href="/login" className="inline-flex items-center min-h-[44px] text-sm font-semibold text-accent">
                    Sign in
                </Link>
            </div>

            <form onSubmit={onSubmit} className="space-y-2">
                <label htmlFor="newsletter-email" className="block text-xs font-semibold text-text-secondary">
                    Newsletter
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        id="newsletter-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text-primary outline-none focus:border-accent"
                    />
                    <Button type="submit" disabled={status === 'loading'} className="h-11 sm:w-auto">
                        {status === 'loading' ? 'Submitting...' : 'Subscribe'}
                    </Button>
                </div>
                {message ? (
                    <p className={status === 'success' ? 'text-xs text-up' : 'text-xs text-down'}>{message}</p>
                ) : null}
            </form>
        </section>
    )
}
