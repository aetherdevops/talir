"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, TrendingUp, List, PieChart, Menu } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BottomNav() {
    const pathname = usePathname()

    const items = [
        { icon: Home, label: 'Home', href: '/' },
        { icon: TrendingUp, label: 'Markets', href: '/markets' },
        { icon: List, label: 'Watchlist', href: '/watchlist' },
        { icon: PieChart, label: 'Portfolio', href: '/portfolio' },
        { icon: Menu, label: 'More', href: '/more' },
    ]

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 block border-t border-border-light bg-surface/90 pb-safe pt-2 backdrop-blur-lg dark:border-border-dark dark:bg-dark-bg/90 md:hidden">
            <div className="flex justify-around items-center">
                {items.map(({ icon: Icon, label, href }) => {
                    const isActive = pathname === href || (href !== '/' && pathname.startsWith(href))
                    return (
                        <Link
                            key={label}
                            href={href}
                            className={cn(
                                "flex flex-col items-center justify-center p-2 text-xs font-medium transition-colors",
                                isActive
                                    ? "text-brand-600 dark:text-brand-500"
                                    : "text-text-secondary hover:text-text-primary"
                            )}
                        >
                            <Icon className={cn("h-6 w-6 mb-1", isActive && "fill-current/20")} />
                            {label}
                        </Link>
                    )
                })}
            </div>
        </nav>
    )
}
