import type { Metadata } from 'next'
import { Inter, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { cn } from '@/lib/utils'
import { headers } from 'next/headers'
import { defaultLocale, isLocale, type Locale } from '@/lib/i18n/config'

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-sans',
    display: 'swap',
})

const sourceSerif = Source_Serif_4({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-serif',
    display: 'swap',
})

const ibmPlexMono = IBM_Plex_Mono({
    subsets: ['latin', 'cyrillic'],
    weight: ['400', '500', '600'],
    variable: '--font-mono',
    display: 'swap',
})

export const viewport = {
    themeColor: '#0A1424',
    viewportFit: 'cover' as const,
}

async function resolveHtmlLang(): Promise<string> {
    const headerStore = await headers()
    const locale = headerStore.get('x-locale')
    if (locale && isLocale(locale)) return locale === 'mk' ? 'mk' : 'en'
    return defaultLocale === 'mk' ? 'mk' : 'en'
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
    const lang = await resolveHtmlLang()

    return (
        <html lang={lang} suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              try {
                const storage = localStorage.getItem('talir-ui-storage');
                const themeColors = { dark: '#0A1424', light: '#F5F2EA' };
                let theme = 'dark';
                if (storage) {
                  const parsed = JSON.parse(storage);
                  if (parsed.state && (parsed.state.theme === 'light' || parsed.state.theme === 'dark')) {
                    theme = parsed.state.theme;
                  }
                }
                const root = document.documentElement;
                root.classList.remove('light', 'dark');
                root.classList.add(theme);
                root.setAttribute('data-theme', theme);
                root.style.colorScheme = theme;
                root.style.backgroundColor = themeColors[theme];
                let meta = document.querySelector('meta[name="theme-color"]');
                if (!meta) {
                  meta = document.createElement('meta');
                  meta.setAttribute('name', 'theme-color');
                  document.head.appendChild(meta);
                }
                meta.setAttribute('content', themeColors[theme]);
              } catch (e) {}
            `,
                    }}
                />
            </head>
            <body
                className={cn(
                    'h-screen w-screen overflow-hidden bg-[var(--bg)] font-sans antialiased text-text-primary selection:bg-accent/30 flex flex-col',
                    inter.variable,
                    sourceSerif.variable,
                    ibmPlexMono.variable
                )}
            >
                {children}
            </body>
        </html>
    )
}
