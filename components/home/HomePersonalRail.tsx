'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Bookmark, Bell, Briefcase, ChevronRight } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { useInstruments } from '@/components/providers/InstrumentsProvider'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { Button } from '@/components/ui/Button'
import { useAlertsStore } from '@/lib/stores/alerts'
import { usePortfolioStore } from '@/lib/stores/portfolio'
import { useWatchlistStore } from '@/lib/stores/watchlist'
import { cn, formatPrice, classifyChangePercent } from '@/lib/utils'

const MAX_WATCHLIST_PREVIEW = 5

interface HomePersonalRailProps {
    variant?: 'rail' | 'compact'
    className?: string
}

function GhostRow({
    icon: Icon,
    title,
    description,
}: {
    icon: React.ElementType
    title: string
    description: string
}) {
    return (
        <div className="rounded-lg border border-dashed border-border/80 bg-surface-secondary/30 px-3 py-2.5 min-w-0">
            <div className="flex items-start gap-2 min-w-0">
                <Icon className="h-4 w-4 shrink-0 text-text-tertiary mt-0.5" aria-hidden />
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-text-secondary">{title}</p>
                    <p className="text-[11px] text-text-tertiary leading-snug mt-0.5">{description}</p>
                </div>
            </div>
        </div>
    )
}

function SignedOutContent({ compact }: { compact: boolean }) {
    return (
        <div className="space-y-3 min-w-0">
            {!compact && (
                <p className="text-xs text-text-tertiary leading-relaxed">
                    Track watchlists, portfolio P&amp;L, and price alerts — synced when you register.
                </p>
            )}
            <GhostRow
                icon={Bookmark}
                title="Your watchlist"
                description="Pin MSE tickers and follow end-of-day moves."
            />
            <GhostRow
                icon={Briefcase}
                title="Portfolio P&amp;L"
                description="Holdings, day gain, and total return in one place."
            />
            <GhostRow
                icon={Bell}
                title="Price alerts"
                description="Get notified when a stock crosses your target."
            />
            <div className="flex flex-col gap-2 pt-1">
                <Link href="/register">
                    <Button className="w-full min-h-[44px]">Register free</Button>
                </Link>
                <Link
                    href="/login"
                    className="text-center text-xs font-semibold text-accent hover:text-accent/80 min-h-[44px] flex items-center justify-center"
                >
                    Sign in
                </Link>
                <Link
                    href="/markets"
                    className="text-center text-[11px] text-text-tertiary hover:text-text-secondary min-h-[44px] flex items-center justify-center"
                >
                    Browse markets without an account
                </Link>
            </div>
        </div>
    )
}

function SignedInContent({ compact }: { compact: boolean }) {
    const instruments = useInstruments()
    const { watchlists, activeListId } = useWatchlistStore()
    const { portfolios, activePortfolioId } = usePortfolioStore()
    const { alerts } = useAlertsStore()

    const activeList = watchlists.find((list) => list.id === activeListId) ?? watchlists[0]
    const activePortfolio = portfolios.find((portfolio) => portfolio.id === activePortfolioId)

    const watchlistPreview = useMemo(() => {
        if (!activeList) return []
        return activeList.items
            .slice(0, MAX_WATCHLIST_PREVIEW)
            .map((item) => {
                const stock = instruments.find((instrument) => instrument.code === item.code)
                return stock ? { code: item.code, stock } : null
            })
            .filter((row): row is { code: string; stock: (typeof instruments)[0] } => row != null)
    }, [activeList, instruments])

    const portfolioSummary = useMemo(() => {
        if (!activePortfolio || activePortfolio.holdings.length === 0) return null

        let dailyGain = 0
        let marketValue = 0

        for (const holding of activePortfolio.holdings) {
            const stock = instruments.find((instrument) => instrument.code === holding.code)
            if (!stock) continue
            dailyGain += (stock.change || 0) * holding.quantity
            marketValue += stock.price * holding.quantity
        }

        const dailyGainPercent = marketValue > 0 ? (dailyGain / marketValue) * 100 : 0
        return { name: activePortfolio.name, dailyGain, dailyGainPercent, holdingCount: activePortfolio.holdings.length }
    }, [activePortfolio, instruments])

    const activeAlertCount = alerts.filter((alert) => alert.isActive && !alert.triggeredAt).length

    return (
        <div className="space-y-4 min-w-0">
            <section className="space-y-2 min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                        Watchlist
                    </h3>
                    <Link
                        href="/watchlist"
                        className="text-[11px] font-semibold text-accent hover:text-accent/80 shrink-0 inline-flex items-center gap-0.5"
                    >
                        Open
                        <ChevronRight className="h-3 w-3" aria-hidden />
                    </Link>
                </div>
                {watchlistPreview.length > 0 ? (
                    <ul className="space-y-1 min-w-0">
                        {watchlistPreview.map(({ code, stock }) => (
                            <li key={code} className="min-w-0">
                                <Link
                                    href={`/stock/${code}`}
                                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-secondary/60 transition-colors min-w-0"
                                >
                                    <span className="font-data text-xs font-semibold text-text-primary truncate">
                                        {code}
                                    </span>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className="font-data text-xs text-text-secondary tabular-nums">
                                            {formatPrice(stock.price)}
                                        </span>
                                        <ChangeLabel change={stock.changePercent} className="text-[11px]" />
                                    </div>
                                </Link>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-[11px] text-text-tertiary px-1">
                        No tickers yet.{' '}
                        <Link href="/watchlist" className="text-accent font-semibold hover:text-accent/80">
                            Add instruments
                        </Link>
                    </p>
                )}
            </section>

            <section className="space-y-2 min-w-0 border-t border-border/60 pt-3">
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                        Portfolio
                    </h3>
                    <Link
                        href="/portfolio"
                        className="text-[11px] font-semibold text-accent hover:text-accent/80 shrink-0 inline-flex items-center gap-0.5"
                    >
                        Open
                        <ChevronRight className="h-3 w-3" aria-hidden />
                    </Link>
                </div>
                {portfolioSummary ? (
                    <div className="rounded-lg border border-border/60 bg-surface-secondary/40 px-3 py-2 min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate">{portfolioSummary.name}</p>
                        <p className="text-[11px] text-text-tertiary font-data mt-0.5">
                            {portfolioSummary.holdingCount} holding
                            {portfolioSummary.holdingCount === 1 ? '' : 's'}
                        </p>
                        <div className="flex items-baseline gap-2 mt-1.5 flex-wrap">
                            <span
                                className={cn(
                                    'font-data text-sm font-semibold tabular-nums',
                                    classifyChangePercent(portfolioSummary.dailyGainPercent) === 'up'
                                        ? 'text-up'
                                        : classifyChangePercent(portfolioSummary.dailyGainPercent) === 'down'
                                          ? 'text-down'
                                          : 'text-neutral'
                                )}
                            >
                                {portfolioSummary.dailyGain > 0 ? '+' : ''}
                                {formatPrice(portfolioSummary.dailyGain)}
                            </span>
                            <ChangeLabel change={portfolioSummary.dailyGainPercent} className="text-xs" />
                        </div>
                    </div>
                ) : (
                    <p className="text-[11px] text-text-tertiary px-1">
                        No holdings yet.{' '}
                        <Link href="/portfolio" className="text-accent font-semibold hover:text-accent/80">
                            Create a portfolio
                        </Link>
                    </p>
                )}
            </section>

            <section className="space-y-2 min-w-0 border-t border-border/60 pt-3">
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                        Alerts
                    </h3>
                    <Link
                        href="/alerts"
                        className="text-[11px] font-semibold text-accent hover:text-accent/80 shrink-0 inline-flex items-center gap-0.5"
                    >
                        Open
                        <ChevronRight className="h-3 w-3" aria-hidden />
                    </Link>
                </div>
                <p className="text-xs text-text-secondary font-data px-1">
                    {activeAlertCount > 0
                        ? `${activeAlertCount} active alert${activeAlertCount === 1 ? '' : 's'}`
                        : 'No active alerts'}
                </p>
            </section>

            {compact && (
                <Link
                    href="/watchlist"
                    className="flex items-center justify-center gap-1 min-h-[44px] text-xs font-semibold text-accent hover:text-accent/80"
                >
                    My Talir
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
            )}
        </div>
    )
}

export function HomePersonalRail({ variant = 'rail', className }: HomePersonalRailProps) {
    const { user, loading } = useAuth()
    const [hydrated, setHydrated] = useState(false)

    useEffect(() => {
        setHydrated(true)
    }, [])

    const compact = variant === 'compact'

    if (!hydrated || loading) {
        return (
            <aside
                className={cn(
                    'rounded-xl border border-border/60 bg-surface-secondary/30 min-w-0',
                    compact ? 'p-3' : 'p-4',
                    className
                )}
                aria-hidden
            >
                <div className="h-32 animate-pulse rounded-lg bg-surface-tertiary/50" />
            </aside>
        )
    }

    return (
        <aside
            className={cn(
                'rounded-xl border border-border/60 bg-surface min-w-0',
                compact ? 'p-3' : 'p-4 xl:sticky xl:top-4 xl:self-start',
                className
            )}
            aria-label="My Talir"
        >
            <h2 className="font-heading text-base font-bold text-text-primary tracking-tight mb-3">
                My Talir
            </h2>
            {user ? <SignedInContent compact={compact} /> : <SignedOutContent compact={compact} />}
        </aside>
    )
}
