'use client'

import { createContext, useCallback, useContext, useMemo } from 'react'
import type { Locale } from '@/lib/i18n/config'
import { getDictionary, translate, type Messages } from '@/lib/i18n/get-dictionary'
import { parsePathname } from '@/lib/i18n/routing'

interface LocaleContextValue {
    locale: Locale
    messages: Messages
    t: (key: string, vars?: Record<string, string | number>) => string
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

function interpolate(template: string, vars?: Record<string, string | number>): string {
    if (!vars) return template
    return template.replace(/\{(\w+)\}/g, (_, key: string) => {
        const value = vars[key]
        return value !== undefined ? String(value) : `{${key}}`
    })
}

export function LocaleProvider({
    locale,
    children,
}: {
    locale: Locale
    children: React.ReactNode
}) {
    const messages = useMemo(() => getDictionary(locale), [locale])

    const t = useCallback(
        (key: string, vars?: Record<string, string | number>) =>
            interpolate(translate(messages, key), vars),
        [messages]
    )

    const value = useMemo(() => ({ locale, messages, t }), [locale, messages, t])

    return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
    const ctx = useContext(LocaleContext)
    if (!ctx) {
        throw new Error('useLocale must be used within LocaleProvider')
    }
    return ctx
}

/** Safe variant for components that may render outside locale layout during transition. */
export function useLocaleOptional(): LocaleContextValue | null {
    return useContext(LocaleContext)
}

export function usePathLocale(pathname: string): Locale {
    return parsePathname(pathname).locale
}
