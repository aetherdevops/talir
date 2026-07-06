import { defaultLocale, type Locale } from './config'

const EN_PREFIX = '/en'

/** Strip public locale prefix; default mk has no URL prefix. */
export function parsePathname(pathname: string): { locale: Locale; pathname: string } {
    if (pathname === EN_PREFIX || pathname.startsWith(`${EN_PREFIX}/`)) {
        const stripped = pathname === EN_PREFIX ? '/' : pathname.slice(EN_PREFIX.length) || '/'
        return { locale: 'en', pathname: stripped }
    }
    return { locale: defaultLocale, pathname: pathname || '/' }
}

/** Build a user-facing path for the given locale. */
export function localizedPath(path: string, locale: Locale): string {
    const normalized = path.startsWith('/') ? path : `/${path}`
    if (locale === defaultLocale) return normalized === '/' ? '/' : normalized
    return normalized === '/' ? EN_PREFIX : `${EN_PREFIX}${normalized}`
}

/** Internal App Router path (always includes locale segment). */
export function internalPath(path: string, locale: Locale): string {
    const normalized = path.startsWith('/') ? path : `/${path}`
    return `/${locale}${normalized === '/' ? '' : normalized}`
}

export function switchLocalePath(pathname: string, target: Locale): string {
    const { pathname: bare } = parsePathname(pathname)
    return localizedPath(bare, target)
}
