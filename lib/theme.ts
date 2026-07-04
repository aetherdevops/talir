export const DEFAULT_THEME = 'dark' as const

export type ThemeMode = 'light' | 'dark'

export const THEME_COLORS: Record<ThemeMode, string> = {
    dark: '#0A1424',
    light: '#F5F2EA',
}

export function syncThemeColorMeta(theme: ThemeMode) {
    if (typeof document === 'undefined') return

    let meta = document.querySelector('meta[name="theme-color"]')
    if (!meta) {
        meta = document.createElement('meta')
        meta.setAttribute('name', 'theme-color')
        document.head.appendChild(meta)
    }
    meta.setAttribute('content', THEME_COLORS[theme])
}

export function applyThemeToDocument(theme: ThemeMode) {
    if (typeof document === 'undefined') return

    const root = document.documentElement
    root.classList.remove('light', 'dark')
    root.classList.add(theme)
    root.setAttribute('data-theme', theme)
    root.style.colorScheme = theme
    root.style.backgroundColor = theme === 'dark' ? THEME_COLORS.dark : THEME_COLORS.light
    syncThemeColorMeta(theme)
}

export function readDocumentTheme(): ThemeMode {
    if (typeof document === 'undefined') return DEFAULT_THEME

    const attr = document.documentElement.getAttribute('data-theme')
    if (attr === 'light' || attr === 'dark') return attr

    return document.documentElement.classList.contains('light') ? 'light' : DEFAULT_THEME
}

export function isDarkTheme(): boolean {
    return readDocumentTheme() === 'dark'
}
