'use client'

import { useState } from 'react'
import { MarketIndex, StockSummary } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PreviewMarketCard } from '@/components/home/PreviewMarketCard'
import { StockPreviewCard } from '@/components/home/StockPreviewCard'

type MainTab = 'indices' | 'stocks'
type StockTab = 'active' | 'gainers' | 'losers'

interface HomePreviewTabsProps {
    indices: MarketIndex[]
    gainers: StockSummary[]
    losers: StockSummary[]
    mostActive: StockSummary[]
}

function TabPills<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { id: T; label: string }[]
    value: T
    onChange: (v: T) => void
}) {
    return (
        <div className="flex p-1 bg-surface-secondary/50 rounded-xl" role="tablist">
            {options.map((opt) => (
                <button
                    key={opt.id}
                    type="button"
                    role="tab"
                    aria-selected={value === opt.id}
                    onClick={() => onChange(opt.id)}
                    className={cn(
                        'flex-1 py-2 px-3 text-xs font-bold rounded-lg transition-all min-h-[44px]',
                        value === opt.id
                            ? 'bg-surface shadow-sm text-brand-text'
                            : 'text-text-tertiary hover:text-text-secondary'
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

function PreviewCarousel({ children }: { children: React.ReactNode }) {
    return (
        <div className="w-full overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
            <div className="flex gap-3">{children}</div>
        </div>
    )
}

export function HomePreviewTabs({
    indices,
    gainers,
    losers,
    mostActive,
}: HomePreviewTabsProps) {
    const [mainTab, setMainTab] = useState<MainTab>('indices')
    const [stockTab, setStockTab] = useState<StockTab>('active')

    const stockLists: Record<StockTab, StockSummary[]> = {
        gainers,
        losers,
        active: mostActive,
    }
    const activeStocks = stockLists[stockTab]

    return (
        <div className="space-y-3">
            <TabPills
                options={[
                    { id: 'indices', label: 'Indices' },
                    { id: 'stocks', label: 'Stocks' },
                ]}
                value={mainTab}
                onChange={setMainTab}
            />

            {mainTab === 'indices' && (
                <PreviewCarousel>
                    {indices.map((idx) => (
                        <PreviewMarketCard
                            key={idx.name}
                            href={`/market/${idx.name}`}
                            label={idx.name}
                            chartSeries={(idx.chartSeries ?? []).slice(-30)}
                            latestPrice={idx.value}
                            changePercent={idx.changePercent}
                        />
                    ))}
                </PreviewCarousel>
            )}

            {mainTab === 'stocks' && (
                <div className="space-y-3">
                    <TabPills
                        options={[
                            { id: 'active', label: 'Active' },
                            { id: 'gainers', label: 'Gainers' },
                            { id: 'losers', label: 'Losers' },
                        ]}
                        value={stockTab}
                        onChange={setStockTab}
                    />
                    <PreviewCarousel>
                        {activeStocks.map((stock) => (
                            <StockPreviewCard key={stock.code} stock={stock} />
                        ))}
                        {activeStocks.length === 0 && (
                            <p className="text-sm text-text-tertiary py-8 px-2">No data available</p>
                        )}
                    </PreviewCarousel>
                </div>
            )}
        </div>
    )
}
