'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Search, Newspaper } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { AuthMenu } from '@/components/layout/AuthMenu'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/layout/SearchBar'
import { MobileSearchSheet } from '@/components/layout/MobileSearchSheet'
import { StockSummary } from '@/lib/types'

export function Header({ className, instruments = [] }: { className?: string; instruments?: StockSummary[] }) {
    const pathname = usePathname()
    const [searchOpen, setSearchOpen] = useState(false)

    return (
        <>
            <header
                className={cn(
                    'relative z-50 flex h-16 w-full items-center justify-between',
                    'border-b border-border/80 bg-talir-navy text-talir-ivory px-4 md:px-6 flex-shrink-0',
                    'dark:bg-talir-navy-deep dark:border-border',
                    className
                )}
            >
                <div className="flex items-center gap-3 [&_.text-text-primary]:text-talir-ivory [&_.text-text-tertiary]:text-talir-gold-soft/70">
                    <Logo />
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
                        className="md:hidden min-h-[44px] min-w-[44px]"
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
