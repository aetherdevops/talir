'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Home, TrendingUp, List, Search, UserPlus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MobileSearchSheet } from '@/components/layout/MobileSearchSheet'
import { CreateActionSheet } from '@/components/layout/CreateActionSheet'

const leftItems = [
    { icon: Home, label: 'Home', href: '/' },
    { icon: TrendingUp, label: 'Markets', href: '/markets' },
] as const

const rightItems = [
    { icon: List, label: 'Watchlist', href: '/watchlist' },
] as const

function NavTab({
    icon: Icon,
    label,
    href,
    isActive,
}: {
    icon: typeof Home
    label: string
    href: string
    isActive: boolean
}) {
    return (
        <Link
            href={href}
            className={cn(
                'flex flex-1 flex-col items-center justify-center min-h-[52px] min-w-[44px] px-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-text-secondary'
            )}
        >
            <Icon className={cn('h-5 w-5 mb-0.5', isActive && 'stroke-[2.5]')} />
            {label}
        </Link>
    )
}

export function BottomNav() {
    const pathname = usePathname()
    const [searchOpen, setSearchOpen] = useState(false)
    const [createOpen, setCreateOpen] = useState(false)

    const isActive = (href: string) =>
        pathname === href || (href !== '/' && pathname.startsWith(href))

    return (
        <>
            <nav
                className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border bg-surface/95 backdrop-blur-md md:hidden"
                style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}
            >
                <div className="relative flex items-stretch pt-1">
                    <div className="flex flex-1 justify-around">
                        {leftItems.map((item) => (
                            <NavTab key={item.label} {...item} isActive={isActive(item.href)} />
                        ))}
                    </div>

                    <div className="w-16 shrink-0" aria-hidden />

                    <div className="flex flex-1 justify-around">
                        {rightItems.map((item) => (
                            <NavTab key={item.label} {...item} isActive={isActive(item.href)} />
                        ))}
                        <button
                            type="button"
                            onClick={() => setSearchOpen(true)}
                            className="flex flex-1 flex-col items-center justify-center min-h-[52px] min-w-[44px] px-1 text-[10px] font-medium text-text-secondary"
                            aria-label="Search"
                        >
                            <Search className="h-5 w-5 mb-0.5" />
                            Search
                        </button>
                    </div>

                    <div className="absolute left-1/2 -translate-x-1/2 -top-5">
                        <button
                            type="button"
                            onClick={() => setCreateOpen(true)}
                            className={cn(
                                'flex h-14 w-14 items-center justify-center rounded-full',
                                'bg-brand-500 text-white shadow-lg shadow-brand-500/30',
                                'border-4 border-surface',
                                'transition-transform active:scale-95'
                            )}
                            aria-label="Create watchlist or portfolio"
                        >
                            <UserPlus className="h-6 w-6" strokeWidth={2.25} />
                        </button>
                    </div>
                </div>
            </nav>

            <MobileSearchSheet open={searchOpen} onClose={() => setSearchOpen(false)} />
            <CreateActionSheet open={createOpen} onClose={() => setCreateOpen(false)} />
        </>
    )
}
