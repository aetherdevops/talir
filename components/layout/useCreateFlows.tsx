'use client'

import { useState, useCallback, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, Briefcase } from 'lucide-react'
import { useRequireAuth } from '@/lib/auth/use-require-auth'
import { useWatchlistStore } from '@/lib/stores/watchlist'
import { usePortfolioStore } from '@/lib/stores/portfolio'
import { CreateListModal } from '@/components/watchlist/CreateListModal'
import { CreatePortfolioModal } from '@/components/portfolio/CreatePortfolioModal'

export const CREATE_ACTIONS = [
    {
        id: 'watchlist' as const,
        icon: Eye,
        title: 'Create Watchlist',
        description: 'Track instruments you care about',
    },
    {
        id: 'portfolio' as const,
        icon: Briefcase,
        title: 'Create Portfolio',
        description: 'Track investments & performance',
    },
] as const

export function useCreateFlows() {
    const router = useRouter()
    const { requireAuth } = useRequireAuth()
    const { createList } = useWatchlistStore()
    const { createPortfolio } = usePortfolioStore()
    const [watchlistModalOpen, setWatchlistModalOpen] = useState(false)
    const [portfolioModalOpen, setPortfolioModalOpen] = useState(false)

    const startWatchlistCreate = useCallback(() => {
        if (!requireAuth()) return false
        setWatchlistModalOpen(true)
        return true
    }, [requireAuth])

    const startPortfolioCreate = useCallback(() => {
        if (!requireAuth()) return false
        setPortfolioModalOpen(true)
        return true
    }, [requireAuth])

    const modals: ReactNode = (
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

    return { startWatchlistCreate, startPortfolioCreate, modals }
}
