'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Search, Newspaper } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { AuthMenu } from '@/components/layout/AuthMenu'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/layout/SearchBar'
import { SessionIndicator } from '@/components/layout/SessionIndicator'
import { StockSummary } from '@/lib/types'

const MobileSearchSheet = dynamic(
    () => import('@/components/layout/MobileSearchSheet').then((mod) => mod.MobileSearchSheet),
    { ssr: false }
)

export function Header({ className, instruments = [] }: { className?: string; instruments?: StockSummary[] }) {
    const pathname = usePathname()
    const [searchOpen, setSearchOpen] = useState(false)

    return (
        <>
            <header
                className={cn(
                    'relative z-50 flex h-16 w-full items-center justify-between gap-2',
                    'border-b border-border/80 bg-talir-navy text-talir-ivory px-4 md:px-6 flex-shrink-0',
                    'dark:bg-talir-navy-deep dark:border-border',
                    'transition-[border-color] duration-500',
                    className
                )}
            >
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 [&_.text-text-primary]:text-talir-ivory [&_.text-text-tertiary]:text-talir-gold-soft/70">
                    <Logo />
                    <SessionIndicator />
                    <Link
                        href="/news"
                        className={cn(
                            'md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-talir-gold-soft/80 hover:text-talir-ivory hover:bg-white/5 transition-colors',
                            pathname === '/news' && 'text-accent'
                        )}
                        aria-label="News"
                    >
                        <Newspaper className="h-5 w-5" />
                    </Link>
                </div>

                <div className="flex flex-1 items-center justify-center px-4 max-w-2xl mx-auto">
                    <div className="hidden w-full md:block">
                        <SearchBar items={instruments} />
                    </div>
                </div>

                <div className="flex items-center gap-2 [&_button]:text-talir-ivory [&_button:hover]:bg-white/10">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden min-h-[44px] min-w-[44px] text-accent hover:text-talir-gold-bright hover:bg-white/10"
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
