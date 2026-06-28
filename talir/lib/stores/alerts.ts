import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface AlertCondition {
    type: 'above' | 'below'
    value: number
}

export interface Alert {
    id: string
    symbol: string
    conditions: AlertCondition[]
    expiration: {
        isOpenEnded: boolean
        date?: string
        time?: string
    }
    email: string
    isActive: boolean
    createdAt: string
}

interface AlertsState {
    alerts: Alert[]
    addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'isActive'>) => void
    updateAlert: (id: string, alert: Partial<Alert>) => void
    removeAlert: (id: string) => void
    toggleAlert: (id: string) => void
}

export const useAlertsStore = create<AlertsState>()(
    persist(
        (set) => ({
            alerts: [],
            addAlert: (alert) => set((state) => ({
                alerts: [
                    {
                        ...alert,
                        id: Math.random().toString(36).substring(7),
                        createdAt: new Date().toISOString(),
                        isActive: true,
                    },
                    ...state.alerts,
                ],
            })),
            updateAlert: (id, updatedAlert) => set((state) => ({
                alerts: state.alerts.map((a) =>
                    a.id === id ? { ...a, ...updatedAlert } : a
                ),
            })),
            removeAlert: (id) => set((state) => ({
                alerts: state.alerts.filter((a) => a.id !== id),
            })),
            toggleAlert: (id) => set((state) => ({
                alerts: state.alerts.map((a) =>
                    a.id === id ? { ...a, isActive: !a.isActive } : a
                ),
            })),
        }),
        {
            name: 'talir-alerts-storage',
        }
    )
)
