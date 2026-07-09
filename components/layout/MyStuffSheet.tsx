'use client'

import { useEffect, useRef, useState } from 'react'
import { Bookmark, Briefcase, Bell, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/components/auth/AuthProvider'
import { useCreateFlows } from '@/components/layout/useCreateFlows'
import { useCreateActions, type CreateActionId } from '@/components/layout/useCreateActions'
import { useLocale } from '@/components/providers/LocaleProvider'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { Button } from '@/components/ui/Button'

interface MyStuffSheetProps {
    open: boolean
    onClose: () => void
}

const NAV_LINKS = [
    { href: '/watchlist', icon: Bookmark, labelKey: 'nav.watchlists', descKey: 'menu.watchlistsDesc' },
    { href: '/portfolio', icon: Briefcase, labelKey: 'nav.portfolios', descKey: 'menu.portfoliosDesc' },
    { href: '/alerts', icon: Bell, labelKey: 'nav.alerts', descKey: 'menu.alertsDesc' },
] as const

const SWIPE_CLOSE_THRESHOLD = 72

export function MyStuffSheet({ open, onClose }: MyStuffSheetProps) {
    const { t } = useLocale()
    const { user, loading } = useAuth()
    const createActions = useCreateActions()
    const { handleCreateAction, modals } = useCreateFlows()
    const [dragOffset, setDragOffset] = useState(0)
    const dragStartY = useRef<number | null>(null)
    const dialogRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (!open) return
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [open])

    useEffect(() => {
        if (!open) setDragOffset(0)
    }, [open])

    useEffect(() => {
        if (!open || !dialogRef.current) return

        const previouslyFocused = document.activeElement as HTMLElement | null

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

    const handleCreate = (id: CreateActionId) => {
        onClose()
        handleCreateAction(id)
    }

    const handleTouchStart = (event: React.TouchEvent) => {
        dragStartY.current = event.touches[0].clientY
    }

    const handleTouchMove = (event: React.TouchEvent) => {
        if (dragStartY.current === null) return
        const delta = event.touches[0].clientY - dragStartY.current
        setDragOffset(Math.max(0, delta))
    }

    const handleTouchEnd = () => {
        if (dragOffset >= SWIPE_CLOSE_THRESHOLD) onClose()
        dragStartY.current = null
        setDragOffset(0)
    }

    if (!open) return <>{modals}</>

    return (
        <>
            <div className="fixed inset-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
                <div
                    ref={dialogRef}
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('menu.myStuffTitle')}
                    className="absolute inset-x-0 bottom-0 bg-surface border-t border-border rounded-t-2xl shadow-2xl transition-transform"
                    style={{
                        paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                        transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleTouchEnd}
                >
                    <div className="flex justify-center pt-3 pb-1" aria-hidden>
                        <span className="h-1 w-10 rounded-full bg-border-active/80" />
                    </div>
                    <div className="flex items-center justify-between px-4 pt-1 pb-2">
                        <h2 className="text-base font-semibold text-text-primary font-heading">{t('menu.myStuffTitle')}</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary"
                            aria-label={t('nav.close')}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="px-4 pb-4 space-y-4">
                        {!loading && !user && (
                            <div className="rounded-xl border border-border bg-surface-secondary/50 p-4 space-y-3">
                                <p className="text-sm text-text-secondary">{t('menu.signedOutHint')}</p>
                                <div className="flex gap-2">
                                    <Button size="sm" asChild>
                                        <LocaleLink href="/login" onClick={onClose}>{t('auth.signIn')}</LocaleLink>
                                    </Button>
                                    <Button size="sm" variant="secondary" asChild>
                                        <LocaleLink href="/register" onClick={onClose}>{t('auth.register')}</LocaleLink>
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            {NAV_LINKS.map(({ href, icon: Icon, labelKey, descKey }) => (
                                <LocaleLink
                                    key={href}
                                    href={href}
                                    onClick={onClose}
                                    className={cn(
                                        'w-full flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl',
                                        'bg-surface-secondary/50 hover:bg-surface-secondary border border-border/60',
                                        'text-left transition-colors group'
                                    )}
                                >
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
                                        <Icon className="h-5 w-5" aria-hidden />
                                    </span>
                                    <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                                        <span className="text-sm font-semibold text-text-primary">{t(labelKey)}</span>
                                        <span className="text-xs text-text-secondary">{t(descKey)}</span>
                                    </span>
                                    <ChevronRight className="h-4 w-4 text-text-tertiary group-hover:text-accent shrink-0" aria-hidden />
                                </LocaleLink>
                            ))}
                        </div>

                        <div className="pt-2 border-t border-border space-y-2">
                            <p className="text-[11px] font-medium uppercase tracking-wider text-text-tertiary px-1">
                                {t('menu.createNew')}
                            </p>
                            {createActions.map(({ id, icon: Icon, title, description }) => (
                                <button
                                    key={id}
                                    type="button"
                                    onClick={() => handleCreate(id)}
                                    className={cn(
                                        'w-full flex items-center gap-3 min-h-[48px] px-3 py-2.5 rounded-lg',
                                        'text-left transition-colors border border-transparent',
                                        'hover:bg-surface-secondary/80 text-text-secondary hover:text-text-primary'
                                    )}
                                >
                                    <Icon className="h-4 w-4 text-text-tertiary shrink-0" aria-hidden />
                                    <span className="flex flex-col gap-0.5 min-w-0">
                                        <span className="text-sm font-medium">{title}</span>
                                        <span className="text-xs text-text-tertiary">{description}</span>
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
            {modals}
        </>
    )
}
