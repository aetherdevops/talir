'use client'

import { useState } from 'react'
import { LogOut, User, Settings } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { Button } from '@/components/ui/Button'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

function AuthDropdown({
    open,
    onClose,
    children,
    className,
}: {
    open: boolean
    onClose: () => void
    children: React.ReactNode
    className?: string
}) {
    if (!open) return null

    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} aria-hidden />
            <div
                className={cn(
                    'absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl z-50 py-2',
                    className
                )}
            >
                {children}
            </div>
        </>
    )
}

export function AuthMenu() {
    const { user, loading, signOut } = useAuth()
    const { t } = useLocale()
    const [open, setOpen] = useState(false)

    const close = () => setOpen(false)

    if (loading) {
        return (
            <div
                className="h-11 w-11 rounded-full bg-surface-secondary animate-pulse shrink-0"
                aria-hidden
            />
        )
    }

    if (!user) {
        return (
            <div className="flex items-center gap-1.5 shrink-0">
                <LocaleLink href="/settings" aria-label={t('nav.settings')} className="hidden md:inline-flex">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-11 w-11 shrink-0 text-talir-gold-soft hover:text-talir-ivory hover:bg-white/10"
                    >
                        <Settings className="h-5 w-5" />
                    </Button>
                </LocaleLink>
                <LocaleLink href="/register" className="hidden md:block">
                    <Button size="sm" className="min-h-[44px]">
                        {t('auth.register')}
                    </Button>
                </LocaleLink>
                <div className="relative shrink-0">
                    <Button
                        variant="ghost"
                        size="icon"
                        type="button"
                        onClick={() => setOpen((value) => !value)}
                        className="h-11 w-11 shrink-0 text-talir-gold-soft hover:text-talir-ivory hover:bg-white/10"
                        aria-label={t('auth.signIn')}
                        aria-expanded={open}
                    >
                        <User className="h-5 w-5" />
                    </Button>
                    <AuthDropdown open={open} onClose={close}>
                        <LocaleLink
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-primary hover:bg-surface-secondary min-h-[44px]"
                            onClick={close}
                        >
                            {t('auth.signIn')}
                        </LocaleLink>
                        <LocaleLink
                            href="/register"
                            className="flex items-center gap-2 px-4 py-2.5 text-sm text-text-primary hover:bg-surface-secondary min-h-[44px] md:hidden"
                            onClick={close}
                        >
                            {t('auth.register')}
                        </LocaleLink>
                    </AuthDropdown>
                </div>
            </div>
        )
    }

    const initial = user.email?.[0]?.toUpperCase() ?? 'U'

    return (
        <div className="relative shrink-0">
            <button
                type="button"
                onClick={() => setOpen((value) => !value)}
                className="h-11 w-11 min-h-[44px] min-w-[44px] rounded-full bg-gradient-to-br from-accent to-talir-gold text-talir-navy flex items-center justify-center font-bold text-sm shadow-md hover:ring-2 hover:ring-offset-2 hover:ring-accent transition-all dark:ring-offset-talir-navy-deep"
                aria-label={t('auth.accountMenu')}
                aria-expanded={open}
            >
                {initial}
            </button>

            <AuthDropdown open={open} onClose={close}>
                <div className="px-4 py-2 border-b border-border">
                    <p className="text-xs text-text-tertiary uppercase tracking-wide">{t('auth.signedInAs')}</p>
                    <p className="text-sm font-medium text-text-primary truncate">{user.email}</p>
                </div>
                <LocaleLink
                    href="/settings"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary min-h-[44px]"
                    onClick={close}
                >
                    <Settings className="h-4 w-4" />
                    {t('nav.settings')}
                </LocaleLink>
                <LocaleLink
                    href="/account"
                    className="flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary min-h-[44px]"
                    onClick={close}
                >
                    <User className="h-4 w-4" />
                    {t('auth.account')}
                </LocaleLink>
                <button
                    type="button"
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-text-primary hover:bg-surface-secondary min-h-[44px]"
                    onClick={async () => {
                        close()
                        await signOut()
                    }}
                >
                    <LogOut className="h-4 w-4" />
                    {t('auth.signOut')}
                </button>
            </AuthDropdown>
        </div>
    )
}
