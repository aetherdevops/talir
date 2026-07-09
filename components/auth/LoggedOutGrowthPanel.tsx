'use client'

import { FormEvent, useState } from 'react'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/components/providers/LocaleProvider'

interface LoggedOutGrowthPanelProps {
    pageLabel: 'watchlists' | 'portfolios' | 'alerts'
}

const PAGE_LABEL_KEYS = {
    watchlists: 'auth.pageLabelWatchlists',
    portfolios: 'auth.pageLabelPortfolios',
    alerts: 'auth.pageLabelAlerts',
} as const

export function LoggedOutGrowthPanel({ pageLabel }: LoggedOutGrowthPanelProps) {
    const { t } = useLocale()
    const [email, setEmail] = useState('')
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
    const [message, setMessage] = useState('')

    const localizedPageLabel = t(PAGE_LABEL_KEYS[pageLabel])

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
                throw new Error(data.message ?? t('auth.subscribeFailed'))
            }

            setStatus('success')
            setMessage(data.message ?? t('auth.subscribeSuccess'))
            setEmail('')
        } catch (error) {
            setStatus('error')
            setMessage(error instanceof Error ? error.message : t('auth.subscribeError'))
        }
    }

    return (
        <section className="rounded-xl border border-border bg-surface p-4 sm:p-5 space-y-4">
            <div className="space-y-1">
                <h2 className="text-base font-heading font-bold text-text-primary">{t('auth.growthTitle')}</h2>
                <p className="text-sm text-text-secondary">
                    {t('auth.growthBody', { pageLabel: localizedPageLabel })}
                </p>
            </div>

            <div className="flex flex-wrap gap-2">
                <LocaleLink href="/register">
                    <Button className="min-h-[44px]">{t('home.registerFree')}</Button>
                </LocaleLink>
                <LocaleLink href="/login" className="inline-flex items-center min-h-[44px] text-sm font-semibold text-accent">
                    {t('auth.signIn')}
                </LocaleLink>
            </div>

            <form onSubmit={onSubmit} className="space-y-2">
                <label htmlFor="newsletter-email" className="block text-xs font-semibold text-text-secondary">
                    {t('auth.newsletter')}
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                    <input
                        id="newsletter-email"
                        type="email"
                        required
                        autoComplete="email"
                        placeholder={t('auth.emailPlaceholder')}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="h-11 w-full rounded-lg border border-border bg-surface-2 px-3 text-sm text-text-primary outline-none focus:border-accent"
                    />
                    <Button type="submit" disabled={status === 'loading'} className="h-11 sm:w-auto">
                        {status === 'loading' ? t('auth.submitting') : t('auth.subscribe')}
                    </Button>
                </div>
                {message ? (
                    <p className={status === 'success' ? 'text-xs text-up' : 'text-xs text-down'}>{message}</p>
                ) : null}
            </form>
        </section>
    )
}
