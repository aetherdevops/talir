'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientIfConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useLocale } from '@/components/providers/LocaleProvider'

const RESEND_COOLDOWN_SEC = 60

function RegisterForm() {
    const { locale, t } = useLocale()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [pendingEmail, setPendingEmail] = useState<string | null>(null)
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
        if (!pendingEmail || cooldown > 0 || resending) return
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
            email: pendingEmail,
        })
        setResending(false)

        if (resendError) {
            setError(resendError.message)
            return
        }

        setResendMsg(t('auth.verifyResent'))
        setCooldown(RESEND_COOLDOWN_SEC)
    }, [pendingEmail, cooldown, resending, t])

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault()
        setError('')
        setResendMsg(null)

        if (password.length < 8) {
            setError(t('auth.passwordMin'))
            return
        }

        if (password !== confirmPassword) {
            setError(t('auth.passwordMismatch'))
            return
        }

        setLoading(true)
        const supabase = createClientIfConfigured()
        if (!supabase) {
            setLoading(false)
            setError(t('auth.authNotConfigured'))
            return
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: { locale },
            },
        })
        setLoading(false)

        if (signUpError) {
            setError(signUpError.message)
            return
        }

        // Always show "check your email" when confirmation is required (no session),
        // including the masked response for an already-registered email.
        if (!data.session) {
            setPendingEmail(email.trim())
            setCooldown(RESEND_COOLDOWN_SEC)
            return
        }

        // Confirmation disabled in project settings — treat as signed in.
        window.location.assign('/alerts')
    }

    if (pendingEmail) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm space-y-4">
                    <h1 className="text-2xl font-bold text-text-primary">{t('auth.verifyTitle')}</h1>
                    <p className="text-sm text-text-secondary">
                        {t('auth.verifyBody', { email: pendingEmail })}
                    </p>

                    {error && <p className="text-sm text-down">{error}</p>}
                    {resendMsg && <p className="text-sm text-text-secondary">{resendMsg}</p>}

                    <Button
                        type="button"
                        className="w-full"
                        disabled={resending || cooldown > 0}
                        onClick={handleResend}
                    >
                        {cooldown > 0
                            ? t('auth.verifyCooldown', { seconds: cooldown })
                            : resending
                              ? t('auth.submitting')
                              : t('auth.verifyResend')}
                    </Button>

                    <p className="text-sm text-text-secondary text-center">
                        {t('auth.alreadyHaveAccount')}{' '}
                        <Link href="/login" className="text-brand-500 hover:underline">
                            {t('auth.signIn')}
                        </Link>
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.registerHeading')}</h1>
                <p className="text-sm text-text-secondary mb-6">{t('auth.registerLead')}</p>

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
                            placeholder={t('auth.passwordPlaceholder')}
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">{t('auth.confirmPasswordLabel')}</Label>
                        <Input
                            id="confirmPassword"
                            type="password"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder={t('auth.confirmPasswordPlaceholder')}
                        />
                    </div>

                    {error && <p className="text-sm text-down">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                    </Button>
                </form>

                <p className="text-sm text-text-secondary mt-6 text-center">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <Link href="/login" className="text-brand-500 hover:underline">
                        {t('auth.signIn')}
                    </Link>
                </p>
            </div>
        </div>
    )
}

export default function RegisterPage() {
    return (
        <Suspense fallback={<div className="max-w-md mx-auto mt-12 text-text-secondary">…</div>}>
            <RegisterForm />
        </Suspense>
    )
}
