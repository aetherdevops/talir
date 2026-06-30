'use client'

import { usePreferencesStore } from '@/lib/stores/preferences'
import { cn } from '@/lib/utils'

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label className="flex items-center justify-between gap-4 py-2 cursor-pointer">
            <span className="text-sm text-text-primary">{label}</span>
            <button
                type="button"
                role="switch"
                aria-checked={checked}
                onClick={() => onChange(!checked)}
                className={cn(
                    'relative h-6 w-11 rounded-full transition-colors flex-shrink-0',
                    checked ? 'bg-accent' : 'bg-surface-tertiary'
                )}
            >
                <span
                    className={cn(
                        'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform',
                        checked && 'translate-x-5'
                    )}
                />
            </button>
        </label>
    )
}

export function NotificationSettings() {
    const { alertsEnabled, showAlertToasts, setPreferences } = usePreferencesStore()

    return (
        <div className="space-y-1 divide-y divide-border">
            <Toggle
                label="Enable price alerts"
                checked={alertsEnabled}
                onChange={(alertsEnabled) => setPreferences({ alertsEnabled })}
            />
            <Toggle
                label="Show in-app alert toasts"
                checked={showAlertToasts}
                onChange={(showAlertToasts) => setPreferences({ showAlertToasts })}
            />
            <p className="text-xs text-text-tertiary pt-3">Email alerts — coming soon</p>
        </div>
    )
}
