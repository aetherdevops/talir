'use client'

import { useEffect, useMemo, useState } from 'react'
import { Bookmark, Bell, Briefcase, ChevronRight, X } from 'lucide-react'
import { useAuth } from '@/components/auth/AuthProvider'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import { useInstruments } from '@/components/providers/InstrumentsProvider'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { Button } from '@/components/ui/Button'
import { useAlertsStore } from '@/lib/stores/alerts'
import { usePortfolioStore } from '@/lib/stores/portfolio'
import { useWatchlistStore } from '@/lib/stores/watchlist'
import { cn, formatPrice, classifyChangePercent } from '@/lib/utils'

const MAX_WATCHLIST_PREVIEW = 5
const RAIL_COLLAPSED_KEY = 'talir-personal-rail-collapsed'

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
        <div className="rounded-lg bg-surface-tertiary px-3 py-2.5 min-w-0">
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
    const { t } = useLocale()

    return (
        <div className="space-y-3 min-w-0">
            {!compact && (
                <p className="text-xs text-text-tertiary leading-relaxed">
                    {t('home.personalRailSignedOutHint')}
                </p>
            )}
            <GhostRow
                icon={Bookmark}
                title={t('home.yourWatchlist')}
                description={t('home.watchlistGhostDesc')}
            />
            <GhostRow
                icon={Briefcase}
                title={t('home.portfolioPnl')}
                description={t('home.portfolioGhostDesc')}
            />
            <GhostRow
                icon={Bell}
                title={t('home.priceAlerts')}
                description={t('home.alertsGhostDesc')}
            />
            <div className="flex flex-col gap-2 pt-1">
                <LocaleLink href="/register">
                    <Button className="w-full min-h-[44px]">{t('home.registerFree')}</Button>
                </LocaleLink>
                <LocaleLink
                    href="/login"
                    className="text-center text-xs font-semibold text-accent hover:text-accent/80 min-h-[44px] flex items-center justify-center"
                >
                    {t('home.signIn')}
                </LocaleLink>
                <LocaleLink
                    href="/markets"
                    className="text-center text-[11px] text-text-tertiary hover:text-text-secondary min-h-[44px] flex items-center justify-center"
                >
                    {t('home.browseWithoutAccount')}
                </LocaleLink>
            </div>
        </div>
    )
}

function SignedInContent({ compact }: { compact: boolean }) {
    const { t } = useLocale()
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
                        {t('nav.watchlist')}
                    </h3>
                    <LocaleLink
                        href="/watchlist"
                        className="text-[11px] font-semibold text-accent hover:text-accent/80 shrink-0 inline-flex items-center gap-0.5"
                    >
                        {t('home.open')}
                        <ChevronRight className="h-3 w-3" aria-hidden />
                    </LocaleLink>
                </div>
                {watchlistPreview.length > 0 ? (
                    <ul className="space-y-1 min-w-0">
                        {watchlistPreview.map(({ code, stock }) => (
                            <li key={code} className="min-w-0">
                                <LocaleLink
                                    href={`/stock/${code}`}
                                    className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-surface-tertiary/80 transition-colors min-w-0"
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
                                </LocaleLink>
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-[11px] text-text-tertiary px-1">
                        {t('home.noTickersYet')}{' '}
                        <LocaleLink href="/watchlist" className="text-accent font-semibold hover:text-accent/80">
                            {t('home.addInstruments')}
                        </LocaleLink>
                    </p>
                )}
            </section>

            <section className="space-y-2 min-w-0 pt-3">
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                        {t('stock.portfolio')}
                    </h3>
                    <LocaleLink
                        href="/portfolio"
                        className="text-[11px] font-semibold text-accent hover:text-accent/80 shrink-0 inline-flex items-center gap-0.5"
                    >
                        {t('home.open')}
                        <ChevronRight className="h-3 w-3" aria-hidden />
                    </LocaleLink>
                </div>
                {portfolioSummary ? (
                    <div className="rounded-lg bg-surface-tertiary px-3 py-2 min-w-0">
                        <p className="text-xs font-semibold text-text-primary truncate">{portfolioSummary.name}</p>
                        <p className="text-[11px] text-text-tertiary font-data mt-0.5">
                            {portfolioSummary.holdingCount === 1
                                ? t('home.holdingCount', { count: portfolioSummary.holdingCount })
                                : t('home.holdingsCount', { count: portfolioSummary.holdingCount })}
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
                        {t('home.noHoldingsYet')}{' '}
                        <LocaleLink href="/portfolio" className="text-accent font-semibold hover:text-accent/80">
                            {t('home.createPortfolio')}
                        </LocaleLink>
                    </p>
                )}
            </section>

            <section className="space-y-2 min-w-0 pt-3">
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-text-tertiary">
                        {t('nav.alerts')}
                    </h3>
                    <LocaleLink
                        href="/alerts"
                        className="text-[11px] font-semibold text-accent hover:text-accent/80 shrink-0 inline-flex items-center gap-0.5"
                    >
                        {t('home.open')}
                        <ChevronRight className="h-3 w-3" aria-hidden />
                    </LocaleLink>
                </div>
                <p className="text-xs text-text-secondary font-data px-1">
                    {activeAlertCount > 0
                        ? activeAlertCount === 1
                            ? t('home.activeAlert', { count: activeAlertCount })
                            : t('home.activeAlerts', { count: activeAlertCount })
                        : t('home.noActiveAlerts')}
                </p>
            </section>

            {compact && (
                <LocaleLink
                    href="/watchlist"
                    className="flex items-center justify-center gap-1 min-h-[44px] text-xs font-semibold text-accent hover:text-accent/80"
                >
                    {t('home.myTalir')}
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </LocaleLink>
            )}
        </div>
    )
}

export function HomePersonalRail({ variant = 'rail', className }: HomePersonalRailProps) {
    const { t } = useLocale()
    const { user, loading } = useAuth()
    const [hydrated, setHydrated] = useState(false)
    const [collapsed, setCollapsed] = useState(false)

    useEffect(() => {
        setHydrated(true)
        try {
            setCollapsed(localStorage.getItem(RAIL_COLLAPSED_KEY) === '1')
        } catch {
            /* ignore */
        }
    }, [])

    const compact = variant === 'compact'

    const dismissRail = () => {
        setCollapsed(true)
        try {
            localStorage.setItem(RAIL_COLLAPSED_KEY, '1')
        } catch {
            /* ignore */
        }
    }

    const expandRail = () => {
        setCollapsed(false)
        try {
            localStorage.removeItem(RAIL_COLLAPSED_KEY)
        } catch {
            /* ignore */
        }
    }

    if (!hydrated || loading) {
        return (
            <aside
                className={cn(
                    'rounded-xl bg-surface-secondary min-w-0',
                    compact ? 'p-3' : 'p-4',
                    className
                )}
                aria-hidden
            >
                <div className="h-32 animate-pulse rounded-lg bg-surface-tertiary/50" />
            </aside>
        )
    }

    if (collapsed) {
        return (
            <aside className={cn('min-w-0', className)} aria-label={t('home.myTalir')}>
                <button
                    type="button"
                    onClick={expandRail}
                    className={cn(
                        'w-full min-h-[44px] rounded-xl bg-surface-secondary px-3 py-2.5',
                        'font-heading text-sm font-bold text-text-primary tracking-tight',
                        'hover:bg-surface-elevated transition-colors text-left',
                        !compact && 'xl:sticky xl:top-4 xl:self-start'
                    )}
                    aria-label={t('home.openMyTalir')}
                >
                    {t('home.myTalir')}
                </button>
            </aside>
        )
    }

    return (
        <aside
            className={cn(
                'rounded-xl bg-surface-secondary min-w-0',
                compact ? 'p-3' : 'p-4 xl:sticky xl:top-4 xl:self-start',
                className
            )}
            aria-label={t('home.myTalir')}
        >
            <div className="flex items-start justify-between gap-2 mb-3 min-w-0">
                <h2 className="font-heading text-base font-bold text-text-primary tracking-tight">
                    {t('home.myTalir')}
                </h2>
                <button
                    type="button"
                    onClick={dismissRail}
                    className="inline-flex items-center justify-center h-8 w-8 shrink-0 rounded-lg text-text-tertiary hover:text-text-primary hover:bg-surface-tertiary transition-colors"
                    aria-label={t('home.dismissMyTalir')}
                >
                    <X className="h-4 w-4" aria-hidden />
                </button>
            </div>
            {user ? <SignedInContent compact={compact} /> : <SignedOutContent compact={compact} />}
        </aside>
    )
}
