'use client'

import { useEffect } from 'react'
import { getMarketSession, MARKET_SESSION_REFRESH_MS } from '@/lib/market-session'

export function MarketSessionEffects() {
    useEffect(() => {
        const sync = () => {
            document.documentElement.setAttribute('data-market', getMarketSession().state)
        }

        sync()
        const timer = window.setInterval(sync, MARKET_SESSION_REFRESH_MS)
        return () => window.clearInterval(timer)
    }, [])

    return null
}
