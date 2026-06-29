import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { isAlertTriggered } from '@/lib/alerts/evaluate'

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
    isActive: boolean
    triggeredAt?: string | null
    createdAt: string
}

interface AlertsState {
    alerts: Alert[]
    addAlert: (alert: Omit<Alert, 'id' | 'createdAt' | 'isActive' | 'triggeredAt'>) => void
    updateAlert: (id: string, alert: Partial<Alert>) => void
    removeAlert: (id: string) => void
    toggleAlert: (id: string) => void
    markTriggered: (id: string) => void
    evaluateAgainstPrices: (prices: Map<string, number>) => string[]
    replaceAll: (alerts: Alert[]) => void
}

export const useAlertsStore = create<AlertsState>()(
    persist(
        (set, get) => ({
            alerts: [],
            addAlert: (alert) => set((state) => ({
                alerts: [
                    {
                        ...alert,
                        id: crypto.randomUUID(),
                        createdAt: new Date().toISOString(),
                        isActive: true,
                        triggeredAt: null,
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
            markTriggered: (id) => set((state) => ({
                alerts: state.alerts.map((a) =>
                    a.id === id
                        ? { ...a, triggeredAt: new Date().toISOString(), isActive: false }
                        : a
                ),
            })),
            evaluateAgainstPrices: (prices) => {
                const triggered: string[] = []
                const state = get()

                for (const alert of state.alerts) {
                    const price = prices.get(alert.symbol)
                    if (price === undefined) continue
                    if (isAlertTriggered(alert, price)) {
                        triggered.push(alert.symbol)
                        get().markTriggered(alert.id)
                    }
                }

                return triggered
            },
            replaceAll: (alerts) => set({ alerts }),
        }),
        {
            name: 'talir-alerts-storage',
        }
    )
)
