'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Bell, X } from 'lucide-react'
import { usePreferencesStore } from '@/lib/stores/preferences'

export function TriggeredAlertToast() {
    const [message, setMessage] = useState<string | null>(null)
    const showAlertToasts = usePreferencesStore((s) => s.showAlertToasts)

    useEffect(() => {
        if (!showAlertToasts) return
        const handler = (event: Event) => {
            const detail = (event as CustomEvent<{ symbol: string }>).detail
            setMessage(`Price alert triggered for ${detail.symbol}`)
        }

        window.addEventListener('talir-alert-triggered', handler)
        return () => window.removeEventListener('talir-alert-triggered', handler)
    }, [showAlertToasts])

    if (!showAlertToasts || !message) return null

    return (
        <div className="fixed bottom-20 md:bottom-6 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex items-start gap-3 rounded-xl border border-brand-500/30 bg-surface p-4 shadow-xl">
                <div className="rounded-full bg-brand-500/10 p-2 text-brand-500">
                    <Bell className="h-4 w-4" />
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-text-primary">{message}</p>
                    <Link href="/alerts" className="text-xs text-brand-500 hover:underline mt-1 inline-block">
                        View alerts
                    </Link>
                </div>
                <button
                    type="button"
                    onClick={() => setMessage(null)}
                    className="text-text-tertiary hover:text-text-primary"
                    aria-label="Dismiss"
                >
                    <X className="h-4 w-4" />
                </button>
            </div>
        </div>
    )
}
