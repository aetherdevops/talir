'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClientIfConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { SectionCard } from '@/components/ui/SectionCard'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import {
    applyRequiredMessages,
    clearCustomValidity,
    setRequiredCustomValidity,
} from '@/lib/auth/form-validity'

export default function AccountPage() {
    const { user, signOut } = useAuth()
    const router = useRouter()
    const { t } = useLocale()
    const requiredMsg = t('auth.fieldRequired')

    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [passwordMsg, setPasswordMsg] = useState<string | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState('')
    const [deleteMsg, setDeleteMsg] = useState<string | null>(null)
    const [busy, setBusy] = useState(false)

    if (!user) {
        return (
            <div className="max-w-lg mx-auto py-12 text-center space-y-4">
                <h1 className="text-2xl font-bold text-text-primary">{t('account.title')}</h1>
                <p className="text-text-secondary">{t('account.signInPrompt')}</p>
                <LocaleLink href="/login" className="inline-flex">
                    <Button>{t('auth.signIn')}</Button>
                </LocaleLink>
            </div>
        )
    }

    const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const form = e.currentTarget
        applyRequiredMessages(form, requiredMsg)
        if (!form.reportValidity()) return

        setPasswordMsg(null)
        if (password.length < 8) {
            setPasswordMsg(t('auth.passwordMin'))
            return
        }
        if (password !== confirmPassword) {
            setPasswordMsg(t('auth.passwordMismatch'))
            return
        }
        setBusy(true)
        const supabase = createClientIfConfigured()
        if (!supabase) {
            setBusy(false)
            setPasswordMsg(t('auth.authNotConfigured'))
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
        setPasswordMsg(t('account.passwordUpdated'))
    }

    const handleDeleteAccount = async () => {
        if (deleteConfirm !== user.email) {
            setDeleteMsg(t('account.deleteConfirmEmail'))
            return
        }
        if (!confirm(t('account.deleteConfirmDialog'))) return

        setBusy(true)
        setDeleteMsg(null)
        const supabase = createClientIfConfigured()
        if (!supabase) {
            setBusy(false)
            setDeleteMsg(t('auth.authNotConfigured'))
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
                <LocaleLink href="/settings" className="text-sm text-accent hover:underline">
                    {t('account.backToSettings')}
                </LocaleLink>
                <h1 className="text-3xl font-bold text-text-primary mt-2">{t('account.title')}</h1>
                <p className="text-text-secondary mt-2">{t('account.subtitle')}</p>
            </header>

            <SectionCard as="div" className="p-6 space-y-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-text-tertiary font-data">
                        {t('auth.emailLabel')}
                    </p>
                    <p className="text-text-primary font-medium font-data">{user.email}</p>
                </div>
            </SectionCard>

            <form noValidate onSubmit={handlePasswordChange}>
                <SectionCard as="div" className="p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-text-primary">{t('account.changePassword')}</h2>
                    <PasswordInput
                        required
                        placeholder={t('account.newPassword')}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onInput={clearCustomValidity}
                        onInvalid={(e) => setRequiredCustomValidity(e, requiredMsg)}
                        autoComplete="new-password"
                    />
                    <PasswordInput
                        required
                        placeholder={t('account.confirmNewPassword')}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        onInput={clearCustomValidity}
                        onInvalid={(e) => setRequiredCustomValidity(e, requiredMsg)}
                        autoComplete="new-password"
                    />
                    {passwordMsg && <p className="text-sm text-text-secondary">{passwordMsg}</p>}
                    <Button type="submit" disabled={busy}>
                        {t('account.updatePassword')}
                    </Button>
                </SectionCard>
            </form>

            <SectionCard as="div" className="p-6 space-y-4">
                <h2 className="text-lg font-semibold text-down">{t('account.deleteAccount')}</h2>
                <p className="text-sm text-text-secondary">{t('account.deleteHint')}</p>
                <Input
                    type="email"
                    placeholder={user.email ?? ''}
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    className="min-h-[44px]"
                />
                {deleteMsg && <p className="text-sm text-down">{deleteMsg}</p>}
                <Button
                    variant="secondary"
                    onClick={handleDeleteAccount}
                    disabled={busy}
                    className="text-down border-down/30"
                >
                    {t('account.deleteMyAccount')}
                </Button>
            </SectionCard>

            <Button variant="ghost" onClick={() => signOut()}>
                {t('auth.signOut')}
            </Button>
        </div>
    )
}
