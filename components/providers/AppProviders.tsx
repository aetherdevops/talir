'use client'

import { AuthProvider } from '@/components/auth/AuthProvider'
import { AlertEvaluator } from '@/components/alerts/AlertEvaluator'
import { TriggeredAlertToast } from '@/components/alerts/TriggeredAlertToast'

export function AppProviders({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
            <AlertEvaluator />
            <TriggeredAlertToast />
            {children}
        </AuthProvider>
    )
}
