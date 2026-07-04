import type { Metadata } from 'next'
import { Inter, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/lib/utils'
import { getAllInstruments } from '@/lib/data'
import { AppProviders } from '@/components/providers/AppProviders'
import { InstrumentsProvider } from '@/components/providers/InstrumentsProvider'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { ScrapeStatusBanner } from '@/components/data/ScrapeStatusBanner'

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

export const metadata: Metadata = {
    title: 'Talir — Macedonian Stock Exchange',
    description: 'End-of-day data from the Macedonian Stock Exchange',
    manifest: '/manifest.json',
    icons: {
        icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
        apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
    },
    openGraph: {
        title: 'Talir — Macedonian Stock Exchange',
        description: 'End-of-day data from the Macedonian Stock Exchange',
        images: [
            {
                url: '/og.png',
                width: 1200,
                height: 630,
                alt: 'Talir — Makedonska Berza · Markets',
            },
        ],
    },
    twitter: {
        card: 'summary_large_image',
        title: 'Talir — Macedonian Stock Exchange',
        description: 'End-of-day data from the Macedonian Stock Exchange',
        images: ['/og.png'],
    },
}

export const viewport = {
    themeColor: '#0A1424',
    viewportFit: 'cover' as const,
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const instruments = await getAllInstruments()

    return (
        <html lang="en" suppressHydrationWarning>
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
                <AppProviders>
                    <InstrumentsProvider instruments={instruments}>
                        <Header instruments={instruments} />

                        <div className="hidden md:block px-4 md:px-6 pt-2">
                            <SponsorSlot placement="leaderboard" />
                        </div>

                        <div className="flex flex-1 overflow-hidden">
                            <Sidebar />

                            <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
                                <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-28 md:pb-8 space-y-4">
                                    <ScrapeStatusBanner />
                                    {children}
                                </div>
                            </main>
                        </div>

                        <BottomNav />
                    </InstrumentsProvider>
                </AppProviders>
            </body>
        </html>
    )
}
