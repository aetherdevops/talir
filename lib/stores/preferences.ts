'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type ChartRange = '1M' | '3M' | '6M' | 'YTD' | '1Y' | '5Y' | 'MAX'
export type ListDensity = 'comfortable' | 'compact'
export type PortfolioCurrency = 'MKD' | 'EUR' | 'USD'

export interface UserPreferences {
    alertsEnabled: boolean
    showAlertToasts: boolean
    defaultChartRange: ChartRange
    listDensity: ListDensity
    defaultPortfolioCurrency: PortfolioCurrency
    locale: 'en' | 'mk'
}

interface PreferencesState extends UserPreferences {
    setPreferences: (prefs: Partial<UserPreferences>) => void
    replaceAll: (prefs: Partial<UserPreferences>) => void
}

export const DEFAULT_PREFERENCES: UserPreferences = {
    alertsEnabled: true,
    showAlertToasts: true,
    defaultChartRange: '1Y',
    listDensity: 'comfortable',
    defaultPortfolioCurrency: 'MKD',
    locale: 'en',
}

export const usePreferencesStore = create<PreferencesState>()(
    persist(
        (set) => ({
            ...DEFAULT_PREFERENCES,
            setPreferences: (prefs) => set((state) => ({ ...state, ...prefs })),
            replaceAll: (prefs) => set((state) => ({ ...state, ...DEFAULT_PREFERENCES, ...prefs })),
        }),
        { name: 'talir-preferences-storage' }
    )
)
