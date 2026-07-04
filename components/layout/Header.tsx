'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { Search, Newspaper, Menu } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { AuthMenu } from '@/components/layout/AuthMenu'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/layout/SearchBar'
import { SessionIndicator } from '@/components/layout/SessionIndicator'
import { useThemeStore } from '@/lib/store'
import { StockSummary } from '@/lib/types'

const MobileSearchSheet = dynamic(
    () => import('@/components/layout/MobileSearchSheet').then((mod) => mod.MobileSearchSheet),
    { ssr: false }
)

export function Header({ className, instruments = [] }: { className?: string; instruments?: StockSummary[] }) {
    const pathname = usePathname()
    const [searchOpen, setSearchOpen] = useState(false)
    const { isSidebarOpen, toggleSidebar } = useThemeStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    const showSidebarExpand = mounted && !isSidebarOpen

    return (
        <>
            <header
                className={cn(
                    'relative z-50 grid h-16 w-full min-w-0 grid-cols-[minmax(0,1fr)_auto] md:grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2',
                    'border-b border-border/80 bg-talir-navy text-talir-ivory px-3 sm:px-4 md:px-6 flex-shrink-0',
                    'dark:bg-talir-navy-deep dark:border-border',
                    'transition-[border-color] duration-500',
                    className
                )}
            >
                <div className="flex items-center gap-2 min-w-0 shrink-0 [&_.text-text-primary]:text-talir-ivory [&_.text-text-tertiary]:text-talir-gold-soft/70">
                    {showSidebarExpand ? (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={toggleSidebar}
                            className="hidden md:flex min-h-[44px] min-w-[44px] shrink-0 text-talir-gold-soft/80 hover:text-talir-ivory hover:bg-white/5"
                            aria-label="Expand sidebar navigation"
                        >
                            <Menu className="h-5 w-5" />
                        </Button>
                    ) : null}
                    <Logo className="shrink-0" />
                    <SessionIndicator />
                    <Link
                        href="/news"
                        className={cn(
                            'md:hidden flex shrink-0 items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-talir-gold-soft/80 hover:text-talir-ivory hover:bg-white/5 transition-colors',
                            pathname === '/news' && 'text-accent'
                        )}
                        aria-label="Updates"
                    >
                        <Newspaper className="h-5 w-5" />
                    </Link>
                </div>

                <div className="hidden md:flex min-w-0 items-center justify-center px-2">
                    <div className="w-full max-w-xl min-w-0">
                        <SearchBar items={instruments} />
                    </div>
                </div>

                <div className="flex items-center justify-end gap-2 shrink-0 [&_button]:text-talir-ivory [&_button:hover]:bg-white/10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden min-h-[44px] min-w-[44px] shrink-0 text-accent hover:text-talir-gold-bright hover:bg-white/10"
                        onClick={() => setSearchOpen(true)}
                        aria-label="Search"
                    >
                        <Search className="h-5 w-5" />
                    </Button>
                    <AuthMenu />
                </div>
            </header>

            <MobileSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    )
}
