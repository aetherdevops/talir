import type { SupabaseClient } from '@supabase/supabase-js'
import type { Alert } from '@/lib/stores/alerts'
import type { Portfolio } from '@/lib/stores/portfolio'
import type { Watchlist } from '@/lib/stores/watchlist'

export interface UserDataSnapshot {
    alerts: Alert[]
    portfolios: Portfolio[]
    activePortfolioId: string | null
    watchlists: Watchlist[]
    activeListId: string | null
}

export async function fetchUserData(
    supabase: SupabaseClient,
    userId: string
): Promise<UserDataSnapshot> {
    const [alertsRes, portfoliosRes, watchlistsRes] = await Promise.all([
        supabase.from('user_alerts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
        supabase.from('user_portfolios').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('user_watchlists').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    ])

    if (alertsRes.error) throw alertsRes.error
    if (portfoliosRes.error) throw portfoliosRes.error
    if (watchlistsRes.error) throw watchlistsRes.error

    const portfolioRows = portfoliosRes.data ?? []
    const portfolioIds = portfolioRows.map((p) => p.id)

    let holdingsRows: Array<{
        id: string
        portfolio_id: string
        code: string
        quantity: number
        buy_price: number
        buy_date: string
        added_at: string
    }> = []

    if (portfolioIds.length > 0) {
        const holdingsRes = await supabase
            .from('user_holdings')
            .select('*')
            .in('portfolio_id', portfolioIds)

        if (holdingsRes.error) throw holdingsRes.error
        holdingsRows = holdingsRes.data ?? []
    }

    const watchlistRows = watchlistsRes.data ?? []
    const watchlistIds = watchlistRows.map((w) => w.id)

    let watchlistItemRows: Array<{
        watchlist_id: string
        code: string
        added_at: string
    }> = []

    if (watchlistIds.length > 0) {
        const itemsRes = await supabase
            .from('user_watchlist_items')
            .select('watchlist_id, code, added_at')
            .in('watchlist_id', watchlistIds)

        if (itemsRes.error) throw itemsRes.error
        watchlistItemRows = itemsRes.data ?? []
    }

    const alerts: Alert[] = (alertsRes.data ?? []).map((row) => ({
        id: row.id,
        symbol: row.symbol,
        conditions: row.conditions,
        expiration: row.expiration,
        isActive: row.is_active,
        triggeredAt: row.triggered_at,
        createdAt: row.created_at,
    }))

    const portfolios: Portfolio[] = portfolioRows.map((row) => ({
        id: row.id,
        name: row.name,
        currency: row.currency as Portfolio['currency'],
        createdAt: row.created_at,
        holdings: holdingsRows
            .filter((h) => h.portfolio_id === row.id)
            .map((h) => ({
                id: h.id,
                code: h.code,
                quantity: Number(h.quantity),
                buyPrice: Number(h.buy_price),
                buyDate: h.buy_date,
                addedAt: h.added_at,
            })),
    }))

    const watchlists: Watchlist[] = watchlistRows.map((row) => ({
        id: row.id,
        name: row.name,
        createdAt: row.created_at,
        items: watchlistItemRows
            .filter((item) => item.watchlist_id === row.id)
            .map((item) => ({
                code: item.code,
                addedAt: item.added_at,
            })),
    }))

    return {
        alerts,
        portfolios,
        activePortfolioId: portfolios[0]?.id ?? null,
        watchlists,
        activeListId: watchlists[0]?.id ?? null,
    }
}

export async function saveUserData(
    supabase: SupabaseClient,
    userId: string,
    snapshot: UserDataSnapshot
): Promise<void> {
    await supabase.from('user_alerts').delete().eq('user_id', userId)
    await supabase.from('user_portfolios').delete().eq('user_id', userId)
    await supabase.from('user_watchlists').delete().eq('user_id', userId)

    if (snapshot.alerts.length > 0) {
        const { error } = await supabase.from('user_alerts').insert(
            snapshot.alerts.map((alert) => ({
                id: alert.id,
                user_id: userId,
                symbol: alert.symbol,
                conditions: alert.conditions,
                expiration: alert.expiration,
                is_active: alert.isActive,
                triggered_at: alert.triggeredAt,
                created_at: alert.createdAt,
            }))
        )
        if (error) throw error
    }

    for (const portfolio of snapshot.portfolios) {
        const { error: portfolioError } = await supabase.from('user_portfolios').insert({
            id: portfolio.id,
            user_id: userId,
            name: portfolio.name,
            currency: portfolio.currency,
            created_at: portfolio.createdAt,
        })
        if (portfolioError) throw portfolioError

        if (portfolio.holdings.length > 0) {
            const { error: holdingsError } = await supabase.from('user_holdings').insert(
                portfolio.holdings.map((holding) => ({
                    id: holding.id,
                    portfolio_id: portfolio.id,
                    code: holding.code,
                    quantity: holding.quantity,
                    buy_price: holding.buyPrice,
                    buy_date: holding.buyDate,
                    added_at: holding.addedAt,
                }))
            )
            if (holdingsError) throw holdingsError
        }
    }

    for (const watchlist of snapshot.watchlists) {
        const { error: watchlistError } = await supabase.from('user_watchlists').insert({
            id: watchlist.id,
            user_id: userId,
            name: watchlist.name,
            created_at: watchlist.createdAt,
        })
        if (watchlistError) throw watchlistError

        if (watchlist.items.length > 0) {
            const { error: itemsError } = await supabase.from('user_watchlist_items').insert(
                watchlist.items.map((item) => ({
                    watchlist_id: watchlist.id,
                    code: item.code,
                    added_at: item.addedAt,
                }))
            )
            if (itemsError) throw itemsError
        }
    }
}

export function readLocalDataSnapshot(): UserDataSnapshot {
    const readPersisted = <T,>(key: string, fallback: T): T => {
        if (typeof window === 'undefined') return fallback
        try {
            const raw = localStorage.getItem(key)
            if (!raw) return fallback
            const parsed = JSON.parse(raw)
            return parsed.state ?? fallback
        } catch {
            return fallback
        }
    }

    const alertsState = readPersisted<{ alerts: Alert[] }>('talir-alerts-storage', { alerts: [] })
    const portfolioState = readPersisted<{
        portfolios: Portfolio[]
        activePortfolioId: string | null
    }>('talir-portfolio-storage', { portfolios: [], activePortfolioId: null })
    const watchlistState = readPersisted<{
        watchlists: Watchlist[]
        activeListId: string | null
    }>('talir-watchlist-storage', { watchlists: [], activeListId: null })

    return {
        alerts: alertsState.alerts ?? [],
        portfolios: portfolioState.portfolios ?? [],
        activePortfolioId: portfolioState.activePortfolioId ?? null,
        watchlists: watchlistState.watchlists ?? [],
        activeListId: watchlistState.activeListId ?? null,
    }
}

export function clearLocalDataStorage(): void {
    if (typeof window === 'undefined') return
    localStorage.removeItem('talir-alerts-storage')
    localStorage.removeItem('talir-portfolio-storage')
    localStorage.removeItem('talir-watchlist-storage')
}

export function hasLocalData(): boolean {
    const snapshot = readLocalDataSnapshot()
    return (
        snapshot.alerts.length > 0 ||
        snapshot.portfolios.length > 0 ||
        snapshot.watchlists.some((list) => list.items.length > 0)
    )
}
