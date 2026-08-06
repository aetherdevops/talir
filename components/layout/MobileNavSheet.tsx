'use client'

import { useEffect, useRef } from 'react'
import {
    Home,
    BarChart2,
    Coins,
    Landmark,
    Newspaper,
    Settings,
    X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useBarePathname } from '@/lib/i18n/use-bare-pathname'

interface MobileNavSheetProps {
    open: boolean
    onClose: () => void
}

const NAV_ITEMS = [
    { href: '/', icon: Home, labelKey: 'nav.home' as const },
    { href: '/markets', icon: BarChart2, labelKey: 'nav.markets' as const },
    { href: '/dividends', icon: Coins, labelKey: 'nav.dividends' as const },
    { href: '/macro', icon: Landmark, labelKey: 'nav.macro' as const },
    { href: '/news', icon: Newspaper, labelKey: 'nav.updates' as const },
    { href: '/settings', icon: Settings, labelKey: 'nav.settings' as const },
]

export function MobileNavSheet({ open, onClose }: MobileNavSheetProps) {
    const { t } = useLocale()
    const pathname = useBarePathname()
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    useEffect(() => {
        if (!open || !dialogRef.current) return

        const previouslyFocused = document.activeElement as HTMLElement | null
        const closeButton = dialogRef.current.querySelector<HTMLElement>('button')
        closeButton?.focus()

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                onClose()
                return
            }

            if (event.key !== 'Tab') return

            const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            if (!focusables?.length) return

            const list = Array.from(focusables).filter(
                (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1
            )
            if (!list.length) return

            const first = list[0]
            const last = list[list.length - 1]

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            document.removeEventListener('keydown', handleKeyDown)
            previouslyFocused?.focus()
        }
    }, [open, onClose])

    if (!open) return null

    const isActive = (href: string) =>
        pathname === href || (href !== '/' && pathname.startsWith(href))

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label={t('menu.mainTitle')}
                className={cn(
                    'absolute inset-y-0 left-0 flex w-[min(100%,20rem)] flex-col',
                    'bg-surface border-r border-border shadow-2xl'
                )}
                style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
            >
                <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                    <h2 className="text-base font-semibold text-text-primary font-heading">
                        {t('menu.mainTitle')}
                    </h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary"
                        aria-label={t('nav.close')}
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto px-3 py-3">
                    <ul className="space-y-1">
                        {NAV_ITEMS.map(({ href, icon: Icon, labelKey }) => {
                            const active = isActive(href)
                            return (
                                <li key={href}>
                                    <LocaleLink
                                        href={href}
                                        onClick={onClose}
                                        className={cn(
                                            'flex items-center gap-3 min-h-[48px] px-3 rounded-xl transition-colors',
                                            active
                                                ? 'bg-accent-muted text-accent font-semibold border border-accent/20'
                                                : 'text-text-secondary hover:bg-surface-secondary hover:text-text-primary border border-transparent'
                                        )}
                                    >
                                        <Icon
                                            className="h-5 w-5 shrink-0"
                                            strokeWidth={active ? 2.5 : 2}
                                            aria-hidden
                                        />
                                        <span className="text-sm font-medium">{t(labelKey)}</span>
                                    </LocaleLink>
                                </li>
                            )
                        })}
                    </ul>
                </nav>
            </div>
        </div>
    )
}
