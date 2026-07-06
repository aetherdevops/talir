'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'
import { usePreferencesStore } from '@/lib/stores/preferences'
import { parsePathname } from '@/lib/i18n/routing'

export function LocaleEffects() {
    const pathname = usePathname()
    const { locale } = useLocale()
    const setPreferences = usePreferencesStore((s) => s.setPreferences)

    useEffect(() => {
        document.documentElement.lang = locale === 'mk' ? 'mk' : 'en'
    }, [locale])

    useEffect(() => {
        const fromPath = parsePathname(pathname).locale
        setPreferences({ locale: fromPath })
    }, [pathname, setPreferences])

    return null
}
