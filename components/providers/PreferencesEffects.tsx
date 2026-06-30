'use client'

import { useEffect } from 'react'
import { usePreferencesStore } from '@/lib/stores/preferences'

export function PreferencesEffects() {
    const listDensity = usePreferencesStore((s) => s.listDensity)

    useEffect(() => {
        document.documentElement.dataset.density = listDensity
    }, [listDensity])

    return null
}
