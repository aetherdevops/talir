import type { Metadata } from 'next'
import { Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { cn } from '@/lib/utils'
import { getAllInstruments } from '@/lib/data'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'Talir - Macedonian Stock Exchange',
  description: 'Track real-time data from the Macedonian Stock Exchange',
  manifest: '/manifest.json',
}

export const viewport = {
  themeColor: '#ffffff',
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
      {/* 
         APP SHELL ARCHITECTURE:
         - h-screen/w-screen: Locks the viewport size.
         - overflow-hidden: Prevents the "Body Scroll".
         - flex-col: Stacks Header on top of Content.
      */}
      <body className={cn(
        "h-screen w-screen overflow-hidden bg-[var(--bg-secondary)] font-sans antialiased text-text-primary selection:bg-brand-500/30 flex flex-col",
        inter.variable,
        jetbrainsMono.variable
      )}>
        {/* Header: Fixed Height, non-sticky (flex item) */}
        <Header instruments={instruments} />

        {/* Main Workspace: Flex-1 to fill remaining space */}
        <div className="flex flex-1 overflow-hidden">

          {/* Sidebar: Fixed width (handled internally), Height = 100% of parent */}
          <Sidebar />

          {/* Scrollable Content Area: This is the ONLY thing that scrolls */}
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
            <div className="max-w-[1600px] mx-auto p-4 md:p-8 pb-24 md:pb-8">
              {children}
            </div>
          </main>

        </div>

        {/* Mobile Nav: Fixed bottom (handled internally or naturally covers) */}
        <BottomNav />
      </body>
    </html>
  )
}
