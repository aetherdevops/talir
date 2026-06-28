"use client"

import { Search } from 'lucide-react'
import { Logo } from '@/components/common/Logo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import { SearchBar } from '@/components/layout/SearchBar'
import { StockSummary } from '@/lib/types'
import { usePathname } from 'next/navigation'

export function Header({ className, instruments = [] }: { className?: string, instruments?: StockSummary[] }) {
    const pathname = usePathname()

    return (
        // Changed: Removed 'sticky top-0'. added 'relative z-50' to stack above everything else (sidebar is z-40 usually)
        <header className={cn(
            "relative z-50 flex h-16 w-full items-center justify-between border-b border-border bg-surface/90 px-4 backdrop-blur-md md:px-6 transition-colors duration-300 flex-shrink-0",
            className
        )}>
            <div className="flex items-center gap-4">
                <Logo />
            </div>

            <div className="flex flex-1 items-center justify-center px-4 max-w-2xl transition-all duration-300 mx-auto">
                {pathname !== '/markets' && (
                    <div className="hidden w-full md:block">
                        <SearchBar items={instruments} />
                    </div>
                )}
            </div>

            <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Search className="h-5 w-5" />
                </Button>
                <ThemeToggle />
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-600 text-white flex items-center justify-center font-bold text-sm shadow-md cursor-pointer hover:ring-2 hover:ring-offset-2 hover:ring-brand-500 transition-all dark:ring-offset-zinc-900">
                    U
                </div>
            </div>
        </header>
    )
}
