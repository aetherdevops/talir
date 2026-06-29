'use client'

import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/auth/AuthProvider'

export function useRequireAuth() {
    const { user, loading } = useAuth()
    const router = useRouter()

    const requireAuth = () => {
        if (loading) return false
        if (user) return true

        const redirect =
            typeof window !== 'undefined' ? window.location.pathname : '/'
        router.push(`/login?redirect=${encodeURIComponent(redirect)}`)
        return false
    }

    return { user, loading, requireAuth }
}
