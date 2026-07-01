import type { Metadata } from 'next'
import { Inter, IBM_Plex_Mono, Source_Serif_4 } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/lib/utils'
import { getAllInstruments, getSearchIndex } from '@/lib/data'
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
    },
}

export const viewport = {
    themeColor: '#0F1F38',
    viewportFit: 'cover' as const,
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const instruments = await getAllInstruments()
    const searchIndex = getSearchIndex()

    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `
              try {
                const storage = localStorage.getItem('talir-ui-storage');
                let theme = 'light';
                if (storage) {
                  const state = JSON.parse(storage).state;
                  theme = state.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                  theme = 'dark';
                }
                document.documentElement.classList.remove('light', 'dark');
                document.documentElement.classList.add(theme);
                document.documentElement.setAttribute('data-theme', theme);
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
                    <InstrumentsProvider instruments={instruments} searchIndex={searchIndex}>
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
