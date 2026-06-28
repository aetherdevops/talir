
"use client"

import { Button } from "@/components/ui/Button"
import { usePortfolioStore } from "@/lib/stores/portfolio"
import { CreatePortfolioModal } from "@/components/portfolio/CreatePortfolioModal"
import { useState } from "react"
import { useRouter } from "next/navigation"

export function HomePortfolioCard() {
    const { portfolios } = usePortfolioStore()
    const router = useRouter()
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
    const { createPortfolio } = usePortfolioStore()

    const handleAction = () => {
        if (portfolios.length === 0) {
            setIsCreateModalOpen(true)
        } else {
            // If they have portfolios, maybe just go to the dashboard? 
            // The user request said "When I press on the Talir Portfolio on the home page I get to create a new portfolio"
            // This implies arguably strictly creating new one. I'll make it open creation modal.
            setIsCreateModalOpen(true)
        }
    }

    return (
        <>
            <Button
                variant="secondary"
                className="bg-white/10 text-white border-white/20 hover:bg-white/20 relative z-10 backdrop-blur-md w-full sm:w-auto"
                onClick={handleAction}
            >
                Create Portfolio
            </Button>

            <CreatePortfolioModal
                isOpen={isCreateModalOpen}
                onClose={() => setIsCreateModalOpen(false)}
                onCreate={(name) => {
                    createPortfolio(name)
                    router.push('/portfolio')
                }}
            />
        </>
    )
}
