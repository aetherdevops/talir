'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClientIfConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Label } from '@/components/ui/Label'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { SectionCard } from '@/components/ui/SectionCard'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
    applyRequiredMessages,
    clearCustomValidity,
    setRequiredCustomValidity,
} from '@/lib/auth/form-validity'

function SetPasswordForm() {
    const router = useRouter()
    const { t } = useLocale()
    const requiredMsg = t('auth.fieldRequired')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [checking, setChecking] = useState(true)
    const [hasSession, setHasSession] = useState(false)

    useEffect(() => {
        const supabase = createClientIfConfigured()
        if (!supabase) {
            setChecking(false)
            return
        }

        let mounted = true
        supabase.auth.getSession().then(({ data }) => {
            if (!mounted) return
            setHasSession(Boolean(data.session))
            setChecking(false)
        })

        const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') {
                setHasSession(Boolean(session))
                setChecking(false)
            }
        })

        return () => {
            mounted = false
            sub.subscription.unsubscribe()
        }
    }, [])

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        const form = event.currentTarget
        applyRequiredMessages(form, requiredMsg)
        if (!form.reportValidity()) return

        setError('')

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

        const { error: updateError } = await supabase.auth.updateUser({ password })
        setLoading(false)

        if (updateError) {
            setError(updateError.message)
            return
        }

        router.push('/alerts')
        router.refresh()
    }

    if (checking) {
        return (
            <div className="max-w-md mx-auto mt-12 text-text-secondary text-sm">
                {t('auth.setPasswordChecking')}
            </div>
        )
    }

    if (!hasSession) {
        return (
            <div className="max-w-md mx-auto mt-12">
                <SectionCard as="div" className="p-8 shadow-sm space-y-4">
                    <h1 className="text-2xl font-bold text-text-primary">{t('auth.setPasswordTitle')}</h1>
                    <p className="text-sm text-text-secondary">{t('auth.setPasswordNeedLink')}</p>
                    <Link href="/login" className="inline-flex w-full">
                        <Button type="button" className="w-full">
                            {t('auth.goToSignIn')}
                        </Button>
                    </Link>
                </SectionCard>
            </div>
        )
    }

    return (
        <div className="max-w-md mx-auto mt-12">
            <SectionCard as="div" className="p-8 shadow-sm">
                <h1 className="text-2xl font-bold text-text-primary mb-2">{t('auth.setPasswordTitle')}</h1>
                <p className="text-sm text-text-secondary mb-6">{t('auth.setPasswordLead')}</p>

                <form noValidate onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="password">{t('auth.passwordLabel')}</Label>
                        <PasswordInput
                            id="password"
                            required
                            autoComplete="new-password"
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
                            autoComplete="new-password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onInput={clearCustomValidity}
                            onInvalid={(e) => setRequiredCustomValidity(e, requiredMsg)}
                            placeholder={t('auth.confirmPasswordPlaceholder')}
                        />
                    </div>

                    {error && <p className="text-sm text-down">{error}</p>}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? t('auth.setPasswordSaving') : t('auth.setPasswordSubmit')}
                    </Button>
                </form>
            </SectionCard>
        </div>
    )
}

export default function SetPasswordPage() {
    return (
        <Suspense fallback={<div className="max-w-md mx-auto mt-12 text-text-secondary">…</div>}>
            <SetPasswordForm />
        </Suspense>
    )
}
