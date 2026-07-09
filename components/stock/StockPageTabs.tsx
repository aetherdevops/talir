'use client'

import { useCallback } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLocale } from '@/components/providers/LocaleProvider'

export const STOCK_TABS = ['overview', 'updates', 'dividends', 'financials', 'portfolio'] as const
export type StockPageTab = (typeof STOCK_TABS)[number]

const TAB_KEYS: Record<StockPageTab, string> = {
    overview: 'stock.overview',
    updates: 'stock.updates',
    dividends: 'stock.dividends',
    financials: 'stock.financials',
    portfolio: 'stock.portfolio',
}

function parseTab(value: string | null): StockPageTab {
    if (value && STOCK_TABS.includes(value as StockPageTab)) {
        return value as StockPageTab
    }
    return 'overview'
}

interface StockPageTabsProps {
    activeTab: StockPageTab
    onTabChange: (tab: StockPageTab) => void
    className?: string
}

export function StockPageTabList({ activeTab, onTabChange, className }: StockPageTabsProps) {
    const { t } = useLocale()

    return (
        <div
            className={cn(
                'flex p-1 bg-surface-secondary/50 rounded-xl overflow-x-auto overscroll-x-contain touch-pan-x scrollbar-hide min-w-0 border border-border',
                className
            )}
            role="tablist"
            aria-label="Stock page sections"
        >
            {STOCK_TABS.map((tab) => (
                <button
                    key={tab}
                    type="button"
                    role="tab"
                    aria-selected={activeTab === tab}
                    onClick={() => onTabChange(tab)}
                    className={cn(
                        'shrink-0 max-w-[40vw] sm:max-w-none px-2.5 sm:px-3 md:px-4 py-2.5 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap truncate min-h-[44px] min-w-[44px]',
                        activeTab === tab
                            ? 'bg-surface text-text-primary shadow-sm border border-border'
                            : 'text-text-secondary hover:text-text-primary hover:bg-surface/80'
                    )}
                >
                    {t(TAB_KEYS[tab])}
                </button>
            ))}
        </div>
    )
}

export function useStockPageTab(): [StockPageTab, (tab: StockPageTab) => void] {
    const searchParams = useSearchParams()
    const router = useRouter()
    const pathname = usePathname()
    const activeTab = parseTab(searchParams.get('tab'))

    const setTab = useCallback(
        (tab: StockPageTab) => {
            const params = new URLSearchParams(searchParams.toString())
            if (tab === 'overview') {
                params.delete('tab')
            } else {
                params.set('tab', tab)
            }
            const qs = params.toString()
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: true })
        },
        [pathname, router, searchParams]
    )

    return [activeTab, setTab]
}
