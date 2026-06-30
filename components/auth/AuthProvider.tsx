'use client'

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import {
    clearLocalDataStorage,
    fetchUserData,
    hasLocalData,
    readLocalDataSnapshot,
    saveUserData,
    type UserDataSnapshot,
} from '@/lib/sync/user-data'
import { useAlertsStore } from '@/lib/stores/alerts'
import { usePortfolioStore } from '@/lib/stores/portfolio'
import { useWatchlistStore } from '@/lib/stores/watchlist'
import { usePreferencesStore, type UserPreferences } from '@/lib/stores/preferences'
import { fetchPreferences, mergePreferences, savePreferences } from '@/lib/sync/preferences'
import { ImportLocalDataModal } from '@/components/auth/ImportLocalDataModal'

interface AuthContextValue {
    user: User | null
    loading: boolean
    signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

function hydrateStores(snapshot: ReturnType<typeof readLocalDataSnapshot>) {
    useAlertsStore.getState().replaceAll(snapshot.alerts)
    usePortfolioStore.getState().replaceAll(snapshot.portfolios, snapshot.activePortfolioId)
    useWatchlistStore.getState().replaceAll(snapshot.watchlists, snapshot.activeListId)
}

function getPreferencesSnapshot(): UserPreferences {
    const s = usePreferencesStore.getState()
    return {
        alertsEnabled: s.alertsEnabled,
        showAlertToasts: s.showAlertToasts,
        defaultChartRange: s.defaultChartRange,
        listDensity: s.listDensity,
        defaultPortfolioCurrency: s.defaultPortfolioCurrency,
        locale: s.locale,
    }
}

function getCurrentSnapshot() {
    const alerts = useAlertsStore.getState().alerts
    const { portfolios, activePortfolioId } = usePortfolioStore.getState()
    const { watchlists, activeListId } = useWatchlistStore.getState()

    return {
        alerts,
        portfolios,
        activePortfolioId,
        watchlists,
        activeListId,
    }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const supabase = useMemo(() => createClient(), [])
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [showImportModal, setShowImportModal] = useState(false)
    const pendingRemoteSnapshot = useRef<UserDataSnapshot | null>(null)
    const syncReady = useRef(false)
    const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

    const scheduleSave = useCallback(() => {
        if (!syncReady.current || !user) return

        if (saveTimer.current) clearTimeout(saveTimer.current)
        saveTimer.current = setTimeout(async () => {
            try {
                await Promise.all([
                    saveUserData(supabase, user.id, getCurrentSnapshot()),
                    savePreferences(supabase, user.id, getPreferencesSnapshot()),
                ])
            } catch (error) {
                console.error('Failed to sync user data', error)
            }
        }, 800)
    }, [supabase, user])

    const loadRemoteData = useCallback(async (nextUser: User) => {
        syncReady.current = false
        const [remote, remotePrefs] = await Promise.all([
            fetchUserData(supabase, nextUser.id),
            fetchPreferences(supabase, nextUser.id).catch(() => ({})),
        ])
        usePreferencesStore.getState().replaceAll(mergePreferences(remotePrefs))
        const remoteEmpty =
            remote.alerts.length === 0 &&
            remote.portfolios.length === 0 &&
            remote.watchlists.every((list) => list.items.length === 0)

        if (remoteEmpty && hasLocalData()) {
            pendingRemoteSnapshot.current = remote
            setShowImportModal(true)
            syncReady.current = true
            return
        }

        hydrateStores(remote)
        syncReady.current = true
    }, [supabase])

    useEffect(() => {
        let mounted = true

        supabase.auth.getUser().then(({ data }) => {
            if (!mounted) return
            setUser(data.user)
            setLoading(false)
            if (data.user) {
                loadRemoteData(data.user).catch((error) => {
                    console.error('Failed to load user data', error)
                    syncReady.current = true
                })
            }
        })

        const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const nextUser = session?.user ?? null
            setUser(nextUser)
            setLoading(false)

            if (nextUser) {
                await loadRemoteData(nextUser)
            } else {
                syncReady.current = false
                setShowImportModal(false)
            }
        })

        return () => {
            mounted = false
            subscription.subscription.unsubscribe()
        }
    }, [supabase, loadRemoteData])

    useEffect(() => {
        const unsubAlerts = useAlertsStore.subscribe(scheduleSave)
        const unsubPortfolio = usePortfolioStore.subscribe(scheduleSave)
        const unsubWatchlist = useWatchlistStore.subscribe(scheduleSave)
        const unsubPrefs = usePreferencesStore.subscribe(scheduleSave)

        return () => {
            unsubAlerts()
            unsubPortfolio()
            unsubWatchlist()
            unsubPrefs()
            if (saveTimer.current) clearTimeout(saveTimer.current)
        }
    }, [scheduleSave])

    const signOut = useCallback(async () => {
        await supabase.auth.signOut()
        setUser(null)
        syncReady.current = false
    }, [supabase])

    const handleImportLocal = useCallback(async () => {
        if (!user) return
        const local = readLocalDataSnapshot()
        hydrateStores(local)
        await saveUserData(supabase, user.id, local)
        clearLocalDataStorage()
        setShowImportModal(false)
    }, [supabase, user])

    const handleSkipImport = useCallback(() => {
        if (pendingRemoteSnapshot.current) {
            hydrateStores(pendingRemoteSnapshot.current)
        }
        setShowImportModal(false)
    }, [])

    const value = useMemo(
        () => ({
            user,
            loading,
            signOut,
        }),
        [user, loading, signOut]
    )

    return (
        <AuthContext.Provider value={value}>
            {children}
            <ImportLocalDataModal
                isOpen={showImportModal}
                onImport={handleImportLocal}
                onSkip={handleSkipImport}
            />
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider')
    }
    return context
}
