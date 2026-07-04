'use client'

import { AuthProvider } from '@/components/auth/AuthProvider'
import { AlertEvaluator } from '@/components/alerts/AlertEvaluator'
import { TriggeredAlertToast } from '@/components/alerts/TriggeredAlertToast'
import { PreferencesEffects } from '@/components/providers/PreferencesEffects'
import { ThemeColorSync } from '@/components/providers/ThemeColorSync'

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <ThemeColorSync />
            <PreferencesEffects />
            <AlertEvaluator />
            <TriggeredAlertToast />
            {children}
        </AuthProvider>
    )
}
