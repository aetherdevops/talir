'use client'

import { useEffect, useState } from 'react'
import { getMarketSession, MARKET_SESSION_REFRESH_MS, type MarketSession } from '@/lib/market-session'
import { cn } from '@/lib/utils'

export function SessionIndicator() {
    const [session, setSession] = useState<MarketSession>(() => getMarketSession())

    useEffect(() => {
        const refresh = () => setSession(getMarketSession())
        refresh()
        const timer = window.setInterval(refresh, MARKET_SESSION_REFRESH_MS)
        return () => window.clearInterval(timer)
    }, [])

    return (
        <>
            <div
                className="hidden lg:flex items-center gap-1.5 shrink-0 font-data text-[10px] tracking-wide text-talir-gold-soft/85"
                aria-live="polite"
            >
                <span
                    className={cn(
                        'inline-flex h-1.5 w-1.5 rounded-full shrink-0',
                        session.isOpen ? 'bg-up' : 'bg-neutral'
                    )}
                    aria-hidden
                />
                <span>{session.label}</span>
            </div>
            <div
                className="flex lg:hidden items-center shrink-0"
                aria-live="polite"
                aria-label={session.label}
                title={session.label}
            >
                <span
                    className={cn(
                        'inline-flex h-2 w-2 rounded-full',
                        session.isOpen ? 'bg-up' : 'bg-neutral'
                    )}
                    aria-hidden
                />
            </div>
        </>
    )
}
