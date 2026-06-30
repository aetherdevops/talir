'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Briefcase, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRequireAuth } from '@/lib/auth/use-require-auth'
import { useWatchlistStore } from '@/lib/stores/watchlist'
import { usePortfolioStore } from '@/lib/stores/portfolio'
import { CreateListModal } from '@/components/watchlist/CreateListModal'
import { CreatePortfolioModal } from '@/components/portfolio/CreatePortfolioModal'

interface CreateActionSheetProps {
    open: boolean
    onClose: () => void
}

const actions = [
    {
        id: 'watchlist',
        icon: Eye,
        title: 'Create Watchlist',
        description: 'Track instruments you care about',
    },
    {
        id: 'portfolio',
        icon: Briefcase,
        title: 'Create Portfolio',
        description: 'Track investments & performance',
    },
] as const

export function CreateActionSheet({ open, onClose }: CreateActionSheetProps) {
    const router = useRouter()
    const { requireAuth } = useRequireAuth()
    const { createList } = useWatchlistStore()
    const { createPortfolio } = usePortfolioStore()
    const [watchlistModalOpen, setWatchlistModalOpen] = useState(false)
    const [portfolioModalOpen, setPortfolioModalOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        document.addEventListener('keydown', onKey)
        document.body.style.overflow = 'hidden'
        return () => {
            document.removeEventListener('keydown', onKey)
            document.body.style.overflow = ''
        }
    }, [open, onClose])

    if (!open) {
        return (
            <>
                <CreateListModal
                    isOpen={watchlistModalOpen}
                    onClose={() => setWatchlistModalOpen(false)}
                    onCreate={(name) => {
                        if (!requireAuth()) return
                        createList(name)
                        router.push('/watchlist')
                    }}
                />
                <CreatePortfolioModal
                    isOpen={portfolioModalOpen}
                    onClose={() => setPortfolioModalOpen(false)}
                    onCreate={(name) => {
                        if (!requireAuth()) return
                        createPortfolio(name)
                        router.push('/portfolio')
                    }}
                />
            </>
        )
    }

    const handleAction = (id: (typeof actions)[number]['id']) => {
        onClose()
        if (!requireAuth()) return
        if (id === 'watchlist') setWatchlistModalOpen(true)
        else setPortfolioModalOpen(true)
    }

    return (
        <>
            <div className="fixed inset-0 z-50 md:hidden">
                <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
                <div
                    role="dialog"
                    aria-modal="true"
                    aria-label="Create"
                    className="absolute inset-x-0 bottom-0 bg-surface border-t border-border rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-200"
                    style={{ paddingBottom: 'max(1rem, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex items-center justify-between px-4 pt-4 pb-2">
                        <h2 className="text-base font-semibold text-text-primary">Create</h2>
                        <button
                            type="button"
                            onClick={onClose}
                            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary"
                            aria-label="Close"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="px-4 pb-2 space-y-2">
                        {actions.map(({ id, icon: Icon, title, description }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => handleAction(id)}
                                className={cn(
                                    'w-full flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl',
                                    'bg-surface-secondary/50 hover:bg-surface-secondary border border-border/60',
                                    'text-left transition-colors'
                                )}
                            >
                                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-500/10 text-brand-600">
                                    <Icon className="h-5 w-5" aria-hidden />
                                </span>
                                <span className="flex flex-col gap-0.5 min-w-0">
                                    <span className="text-sm font-semibold text-text-primary">{title}</span>
                                    <span className="text-xs text-text-secondary">{description}</span>
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <CreateListModal
                isOpen={watchlistModalOpen}
                onClose={() => setWatchlistModalOpen(false)}
                onCreate={(name) => {
                    if (!requireAuth()) return
                    createList(name)
                    router.push('/watchlist')
                }}
            />
            <CreatePortfolioModal
                isOpen={portfolioModalOpen}
                onClose={() => setPortfolioModalOpen(false)}
                onCreate={(name) => {
                    if (!requireAuth()) return
                    createPortfolio(name)
                    router.push('/portfolio')
                }}
            />
        </>
    )
}
