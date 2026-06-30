import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/lib/utils'
import { getAllInstruments } from '@/lib/data'
import { AppProviders } from '@/components/providers/AppProviders'
import { InstrumentsProvider } from '@/components/providers/InstrumentsProvider'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'

const inter = Inter({
    subsets: ['latin', 'cyrillic'],
    variable: '--font-sans',
    display: 'swap',
})

export const metadata: Metadata = {
  title: 'Talir - Macedonian Stock Exchange',
  description: 'End-of-day data from the Macedonian Stock Exchange',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#fafafa',
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
                if (storage) {
                  const state = JSON.parse(storage).state;
                  if (state.theme === 'dark' || (!state.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={cn(
        "h-screen w-screen overflow-hidden bg-[var(--bg)] font-sans antialiased text-text-primary selection:bg-accent/30 flex flex-col",
        inter.variable
      )}>
        <AppProviders>
        <InstrumentsProvider instruments={instruments}>
        <Header instruments={instruments} />

        <div className="hidden md:block px-4 md:px-6 pt-2">
          <SponsorSlot placement="leaderboard" />
        </div>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar />

          <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-28 md:pb-8">
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
