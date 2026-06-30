'use client'

import { AuthProvider } from '@/components/auth/AuthProvider'
import { AlertEvaluator } from '@/components/alerts/AlertEvaluator'
import { TriggeredAlertToast } from '@/components/alerts/TriggeredAlertToast'
import { PreferencesEffects } from '@/components/providers/PreferencesEffects'

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <PreferencesEffects />
            <AlertEvaluator />
            <TriggeredAlertToast />
            {children}
        </AuthProvider>
    )
}
