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
                    'relative z-50 flex h-16 w-full items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-md md:px-6 transition-colors duration-300 flex-shrink-0',
                    className
                )}
            >
                <div className="flex items-center gap-3">
                    <Logo />
                    <Link
                        href="/news"
                        className={cn(
                            'md:hidden flex items-center justify-center min-h-[44px] min-w-[44px] rounded-lg text-text-secondary hover:text-text-primary hover:bg-surface-secondary transition-colors',
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

                <div className="flex items-center gap-2">
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
