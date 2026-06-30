'use client'

import { useState } from 'react'
import { useAuth } from '@/components/auth/AuthProvider'
import { createClientIfConfigured } from '@/lib/supabase/client'
import { Button } from '@/components/ui/Button'
import {
    clearLocalDataStorage,
    fetchUserData,
    readLocalDataSnapshot,
} from '@/lib/sync/user-data'
import { useAlertsStore } from '@/lib/stores/alerts'
import { usePortfolioStore } from '@/lib/stores/portfolio'
import { useWatchlistStore } from '@/lib/stores/watchlist'

export function DataPrivacySettings() {
    const { user } = useAuth()
    const [status, setStatus] = useState<string | null>(null)

    const handleExport = async () => {
        setStatus(null)
        const local = readLocalDataSnapshot()
        let remote = null

        if (user) {
            const supabase = createClientIfConfigured()
            if (!supabase) {
                setStatus('Cloud sync is not configured.')
                return
            }
            try {
                remote = await fetchUserData(supabase, user.id)
            } catch {
                setStatus('Could not fetch cloud data.')
                return
            }
        }

        const blob = new Blob([JSON.stringify({ local, remote, exportedAt: new Date().toISOString() }, null, 2)], {
            type: 'application/json',
        })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `talir-export-${new Date().toISOString().slice(0, 10)}.json`
        a.click()
        URL.revokeObjectURL(url)
        setStatus('Download started.')
    }

    const handleClearLocal = () => {
        if (!confirm('Clear alerts, portfolios, and watchlists stored on this device?')) return
        clearLocalDataStorage()
        useAlertsStore.getState().replaceAll([])
        usePortfolioStore.getState().replaceAll([], null)
        useWatchlistStore.getState().replaceAll([], null)
        setStatus('Local data cleared.')
    }

    return (
        <div className="space-y-4">
            <Button variant="secondary" onClick={handleExport} className="w-full sm:w-auto">
                Download my data
            </Button>
            <Button variant="ghost" onClick={handleClearLocal} className="w-full sm:w-auto">
                Clear data on this device
            </Button>
            {status && <p className="text-sm text-text-secondary">{status}</p>}
            <p className="text-xs text-text-tertiary">
                Cloud data remains if you are signed in. See privacy policy when published.
            </p>
        </div>
    )
}
