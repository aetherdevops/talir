'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClientIfConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { SectionCard } from '@/components/ui/SectionCard'
import { useLocale } from '@/components/providers/LocaleProvider'
import { localizedPath } from '@/lib/i18n/routing'
import {
    applyRequiredMessages,
    clearCustomValidity,
    setRequiredCustomValidity,
} from '@/lib/auth/form-validity'

const RESEND_COOLDOWN_SEC = 60

function RegisterForm() {
    const { locale, t } = useLocale()
    const requiredMsg = t('auth.fieldRequired')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [pendingEmail, setPendingEmail] = useState<string | null>(null)
    const [existingEmail, setExistingEmail] = useState<string | null>(null)
    const [loginLinkSent, setLoginLinkSent] = useState(false)
    const [resendMsg, setResendMsg] = useState<string | null>(null)
    const [cooldown, setCooldown] = useState(0)
    const [resending, setResending] = useState(false)
    const [sendingLink, setSendingLink] = useState(false)

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

    const handleSendLoginLink = useCallback(async () => {
        if (!existingEmail || cooldown > 0 || sendingLink) return
        setSendingLink(true)
        setError('')
        setResendMsg(null)

        const supabase = createClientIfConfigured()
        if (!supabase) {
            setSendingLink(false)
            setError(t('auth.authNotConfigured'))
            return
        }

        const redirectTo = `${window.location.origin}/auth/confirm?next=${encodeURIComponent(
            localizedPath('/set-password', locale)
        )}`

        const { error: resetError } = await supabase.auth.resetPasswordForEmail(existingEmail, {
            redirectTo,
        })
        setSendingLink(false)

        if (resetError) {
            setError(resetError.message)
            return
        }

        setLoginLinkSent(true)
        setResendMsg(t('auth.loginLinkSent'))
        setCooldown(RESEND_COOLDOWN_SEC)
    }, [existingEmail, cooldown, sendingLink, locale, t])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget
        applyRequiredMessages(form, requiredMsg)
        if (!form.reportValidity()) return

        setError('')
        setResendMsg(null)
        setExistingEmail(null)
        setLoginLinkSent(false)

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

        const identitiesLen = data.user?.identities?.length ?? null
        const likelyExistingUser = Boolean(data.user) && identitiesLen === 0 && !data.session

        if (likelyExistingUser) {
            setExistingEmail(email.trim())
            return
        }

        if (!data.session) {
            setPendingEmail(email.trim())
            setCooldown(RESEND_COOLDOWN_SEC)
            return
        }

        window.location.assign('/alerts')
    }

    if (existingEmail) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <SectionCard as="div" className="p-8 shadow-sm space-y-4">
                    <h1 className="text-2xl font-bold text-text-primary">{t('auth.alreadyRegisteredTitle')}</h1>
                    <p className="text-sm text-text-secondary">{t('auth.alreadyRegistered')}</p>
                    <p className="text-sm text-text-secondary">
                        {t('auth.loginLinkHint', { email: existingEmail })}
                    </p>

                    {error && <p className="text-sm text-down">{error}</p>}
                    {resendMsg && <p className="text-sm text-text-secondary">{resendMsg}</p>}

                    <Button
                        type="button"
                        className="w-full"
                        disabled={sendingLink || cooldown > 0}
                        onClick={handleSendLoginLink}
                    >
                        {cooldown > 0 && loginLinkSent
                            ? t('auth.verifyCooldown', { seconds: cooldown })
                            : sendingLink
                              ? t('auth.submitting')
                              : loginLinkSent
                                ? t('auth.loginLinkResend')
                                : t('auth.loginLinkSend')}
                    </Button>

                    <Link href="/login" className="inline-flex w-full">
                        <Button type="button" variant="secondary" className="w-full">
                            {t('auth.goToSignIn')}
                        </Button>
                    </Link>
                </SectionCard>
            </div>
        )
    }

    if (pendingEmail) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <SectionCard as="div" className="p-8 shadow-sm space-y-4">
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
                </SectionCard>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <SectionCard as="div" className="p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.registerHeading')}</h1>
                <p className="text-sm text-text-secondary mb-6">{t('auth.registerLead')}</p>

                <form noValidate onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="email">{t('auth.emailLabel')}</Label>
                        <Input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onInput={clearCustomValidity}
                            onInvalid={(e) => setRequiredCustomValidity(e, requiredMsg)}
                            placeholder={t('auth.emailPlaceholder')}
                        />
                    </div>
                    <div>
                        <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                        <PasswordInput
                            id="password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onInput={clearCustomValidity}
                            onInvalid={(e) => setRequiredCustomValidity(e, requiredMsg)}
                            placeholder={t('auth.passwordPlaceholder')}
                        />
                    </div>
                    <div>
                        <Label htmlFor="confirmPassword">{t('auth.confirmPasswordLabel')}</Label>
                        <PasswordInput
                            id="confirmPassword"
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onInput={clearCustomValidity}
                            onInvalid={(e) => setRequiredCustomValidity(e, requiredMsg)}
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
            </SectionCard>
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
