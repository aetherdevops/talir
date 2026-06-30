
"use client"

import { Button } from "@/components/ui/Button"
import { usePortfolioStore } from "@/lib/stores/portfolio"
import { useRouter } from "next/navigation"
import { useRequireAuth } from '@/lib/auth/use-require-auth'

export function HomePortfolioCard() {
    const { portfolios } = usePortfolioStore()
    const router = useRouter()
    const { requireAuth } = useRequireAuth()

    const handleAction = () => {
        if (!requireAuth()) return
        router.push('/portfolio')
    }

    return (
        <Button
            variant="secondary"
            className="w-full sm:w-auto"
            onClick={handleAction}
        >
            {portfolios.length === 0 ? 'Open Portfolio' : 'View Portfolio'}
        </Button>
    )
}
