export const locales = ['mk', 'en'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'mk'

export function isLocale(value: string): value is Locale {
    return locales.includes(value as Locale)
}
