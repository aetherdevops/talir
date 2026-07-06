'use client'

import { useState } from 'react'
import { Home, TrendingUp, List, Settings, Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'
import { MyStuffSheet } from '@/components/layout/MyStuffSheet'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useBarePathname } from '@/lib/i18n/use-bare-pathname'
import { useLocale } from '@/components/providers/LocaleProvider'

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
        <LocaleLink
            href={href}
            className={cn(
                'flex flex-1 flex-col items-center justify-center min-h-[52px] min-w-[44px] px-1 text-[10px] font-medium transition-colors',
                isActive ? 'text-accent' : 'text-text-secondary'
            )}
        >
            <Icon className={cn('h-5 w-5 mb-0.5', isActive && 'stroke-[2.5]')} />
            {label}
        </LocaleLink>
    )
}

export function BottomNav() {
    const pathname = useBarePathname()
    const { t } = useLocale()
    const [myStuffOpen, setMyStuffOpen] = useState(false)

    const leftItems = [
        { icon: Home, label: t('nav.home'), href: '/' },
        { icon: TrendingUp, label: t('nav.markets'), href: '/markets' },
    ] as const

    const rightItems = [
        { icon: List, label: t('nav.watchlist'), href: '/watchlist' },
        { icon: Settings, label: t('nav.settings'), href: '/settings' },
    ] as const

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
                            <NavTab key={item.href} {...item} isActive={isActive(item.href)} />
                        ))}
                    </div>
                    <div className="w-16 shrink-0" aria-hidden />
                    <div className="flex flex-1 justify-around">
                        {rightItems.map((item) => (
                            <NavTab key={item.href} {...item} isActive={isActive(item.href)} />
                        ))}
                    </div>
                    <div className="absolute left-1/2 -translate-x-1/2 -top-5">
                        <button
                            type="button"
                            onClick={() => setMyStuffOpen(true)}
                            className={cn(
                                'flex h-14 w-14 items-center justify-center rounded-full',
                                'bg-talir-navy text-accent shadow-lg shadow-talir-navy/40',
                                'border-4 border-surface ring-2 ring-accent/30 transition-transform active:scale-95'
                            )}
                            aria-label={t('nav.myStuff')}
                        >
                            <Bookmark className="h-6 w-6" strokeWidth={2.25} />
                        </button>
                    </div>
                </div>
            </nav>

            <MyStuffSheet open={myStuffOpen} onClose={() => setMyStuffOpen(false)} />
        </>
    )
}
