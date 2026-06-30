'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, TrendingUp, List, Newspaper, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileSearchSheet } from '@/components/layout/MobileSearchSheet'

export function BottomNav() {
    const pathname = usePathname()
    const [searchOpen, setSearchOpen] = useState(false)

    const items = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: TrendingUp, label: 'Markets', href: '/markets' },
        { icon: List, label: 'Watchlist', href: '/watchlist' },
        { icon: Newspaper, label: 'News', href: '/news' },
    ]

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border bg-surface/95 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-1 backdrop-blur-md md:hidden">
                <div className="flex justify-around items-stretch">
                    {items.map(({ icon: Icon, label, href }) => {
                        const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
                        return (
                            <Link
                                key={label}
                                href={href}
                                className={cn(
                                    'flex flex-col items-center justify-center min-h-[52px] min-w-[52px] px-2 text-[10px] font-medium transition-colors',
                                    isActive ? 'text-accent' : 'text-text-secondary'
                                )}
                            >
                                <Icon className={cn('h-5 w-5 mb-0.5', isActive && 'stroke-[2.5]')} />
                                {label}
                            </Link>
                        )
                    })}
                    <button
                        type="button"
                        onClick={() => setSearchOpen(true)}
                        className="flex flex-col items-center justify-center min-h-[52px] min-w-[52px] px-2 text-[10px] font-medium text-text-secondary"
                        aria-label="Search"
                    >
                        <Search className="h-5 w-5 mb-0.5" />
                        Search
                    </button>
                </div>
            </nav>
            <MobileSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
        </>
    )
}
