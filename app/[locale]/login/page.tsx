'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClientIfConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useLocale } from '@/components/providers/LocaleProvider'

const RESEND_COOLDOWN_SEC = 60

function LoginForm() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const { t } = useLocale()
    const redirect = searchParams.get('redirect') || '/'
    const initialError = searchParams.get('error')

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState(() => {
        if (initialError === 'auth_callback_failed') return t('auth.authFailed')
        if (initialError === 'verify_failed') return t('auth.verifyFailed')
        return ''
    })
    const [needsConfirm, setNeedsConfirm] = useState(initialError === 'verify_failed')
    const [loading, setLoading] = useState(false)
    const [resendMsg, setResendMsg] = useState<string | null>(null)
    const [cooldown, setCooldown] = useState(0)
    const [resending, setResending] = useState(false)

    useEffect(() => {
        if (cooldown <= 0) return
        const id = window.setInterval(() => {
            setCooldown((prev) => (prev <= 1 ? 0 : prev - 1))
        }, 1000)
        return () => window.clearInterval(id)
    }, [cooldown])

    const handleResend = useCallback(async () => {
        const target = email.trim()
        if (!target || cooldown > 0 || resending) return
        setResending(true)
        setResendMsg(null)
        setError('')

        const supabase = createClientIfConfigured()
        if (!supabase) {
            setResending(false)
            setError(t('auth.authNotConfigured'))
            return
        }

        const { error: resendError } = await supabase.auth.resend({
            type: 'signup',
            email: target,
        })
        setResending(false)

        if (resendError) {
            setError(resendError.message)
            return
        }

        setResendMsg(t('auth.verifyResent'))
        setCooldown(RESEND_COOLDOWN_SEC)
    }, [email, cooldown, resending, t])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setLoading(true)
        setError('')
        setResendMsg(null)
        setNeedsConfirm(false)

        const supabase = createClientIfConfigured()
        if (!supabase) {
            setLoading(false)
            setError(t('auth.authNotConfigured'))
            return
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        setLoading(false)

        if (signInError) {
            if (signInError.code === 'email_not_confirmed') {
                setNeedsConfirm(true)
                setError(t('auth.notConfirmed'))
                return
            }
            setError(signInError.message)
            return
        }

        router.push(redirect)
        router.refresh()
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.loginHeading')}</h1>
                <p className="text-sm text-text-secondary mb-6">{t('auth.loginLead')}</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email">{t('auth.emailLabel')}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={t('auth.emailPlaceholder')}
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                        <Input
                            id="password"
                            type="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('auth.passwordLoginPlaceholder')}
                        />
                    </div>

                    {error && <p className="text-sm text-down">{error}</p>}
                    {resendMsg && <p className="text-sm text-text-secondary">{resendMsg}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t('auth.signingIn') : t('auth.signIn')}
                    </Button>
                </form>

                {needsConfirm && (
                    <div className="mt-4">
                        <Button
                            type="button"
                            variant="secondary"
                            className="w-full"
                            disabled={!email.trim() || resending || cooldown > 0}
                            onClick={handleResend}
                        >
                            {cooldown > 0
                                ? t('auth.verifyCooldown', { seconds: cooldown })
                                : resending
                                  ? t('auth.submitting')
                                  : t('auth.verifyResend')}
                        </Button>
                    </div>
                )}

                <p className="text-sm text-text-secondary mt-6 text-center">
                    {t('auth.noAccountYet')}{' '}
                    <Link href="/register" className="text-brand-500 hover:underline">
                        {t('auth.createOne')}
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function LoginPage() {
    return (
        <Suspense fallback={<div className="max-w-md mx-auto mt-12 text-text-secondary">…</div>}>
            <LoginForm />
        </Suspense>
    )
}
