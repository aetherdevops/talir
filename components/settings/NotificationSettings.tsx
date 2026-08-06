'use client'

import { usePreferencesStore } from '@/lib/stores/preferences'
import { useLocale } from '@/components/providers/LocaleProvider'
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
                        'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface-elevated transition-transform',
                        checked && 'translate-x-5'
                    )}
                />
            </button>
        </label>
    )
}

export function NotificationSettings() {
    const { alertsEnabled, showAlertToasts, setPreferences } = usePreferencesStore()
    const { t } = useLocale()

    return (
        <div className="space-y-1 divide-y divide-border">
            <Toggle
                label={t('settings.alertsEnabled')}
                checked={alertsEnabled}
                onChange={(alertsEnabled) => setPreferences({ alertsEnabled })}
            />
            <Toggle
                label={t('settings.alertToasts')}
                checked={showAlertToasts}
                onChange={(showAlertToasts) => setPreferences({ showAlertToasts })}
            />
            <p className="text-xs text-text-tertiary pt-3">{t('settings.emailAlertsSoon')}</p>
        </div>
    )
}
