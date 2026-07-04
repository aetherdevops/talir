'use client'

import { useEffect } from 'react'
import { useThemeStore } from '@/lib/store'
import { syncThemeColorMeta } from '@/lib/theme'

export function ThemeColorSync() {
    const theme = useThemeStore((state) => state.theme)

    useEffect(() => {
        syncThemeColorMeta(theme)
    }, [theme])

    return null
}
