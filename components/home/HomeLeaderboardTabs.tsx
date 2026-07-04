'use client'

import { useState } from 'react'
import Link from 'next/link'
import { StockSummary } from '@/lib/types'
import { cn } from '@/lib/utils'
import { CompactQuoteCard } from '@/components/home/CompactQuoteCard'
import { DesktopScrollRow } from '@/components/home/DesktopScrollRow'
import { StockPreviewCard } from '@/components/home/StockPreviewCard'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { ChevronRight } from 'lucide-react'

type StockTab = 'active' | 'gainers' | 'losers'

const MAX_PREVIEW_ITEMS = 6

interface HomeLeaderboardTabsProps {
    gainers: StockSummary[]
    losers: StockSummary[]
    mostActive: StockSummary[]
    asOfDate: string
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
                            ? 'bg-surface shadow-sm text-accent border border-accent/20'
                            : 'text-text-tertiary hover:text-text-secondary'
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

function PreviewGrid({ children }: { children: React.ReactNode }) {
    return <div className="grid grid-cols-2 gap-2 w-full min-w-0">{children}</div>
}

export function HomeLeaderboardTabs({
    gainers,
    losers,
    mostActive,
    asOfDate,
}: HomeLeaderboardTabsProps) {
    const [stockTab, setStockTab] = useState<StockTab>('active')

    const stockLists: Record<StockTab, StockSummary[]> = {
        gainers,
        losers,
        active: mostActive,
    }
    const activeStocks = stockLists[stockTab]
    const previewStocks = activeStocks.slice(0, MAX_PREVIEW_ITEMS)
    const hasMoreStocks = activeStocks.length > MAX_PREVIEW_ITEMS

    return (
        <section className="space-y-2 min-w-0" aria-labelledby="home-leaderboards-heading">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between min-w-0">
                <h2
                    id="home-leaderboards-heading"
                    className="font-heading text-base font-bold text-text-primary tracking-tight"
                >
                    Leaderboards
                </h2>
                <DataFreshnessLabel asOfDate={asOfDate} variant="compact" />
            </div>

            <TabPills
                options={[
                    { id: 'active', label: 'Most active' },
                    { id: 'gainers', label: 'Gainers' },
                    { id: 'losers', label: 'Losers' },
                ]}
                value={stockTab}
                onChange={setStockTab}
            />

            {previewStocks.length > 0 ? (
                <>
                    <div className="lg:hidden">
                        <PreviewGrid>
                            {previewStocks.map((stock) => (
                                <StockPreviewCard key={stock.code} stock={stock} />
                            ))}
                        </PreviewGrid>
                    </div>
                    <div className="hidden lg:block min-w-0">
                        <DesktopScrollRow>
                            {previewStocks.map((stock) => (
                                <CompactQuoteCard
                                    key={stock.code}
                                    href={`/stock/${stock.code}`}
                                    label={stock.code}
                                    subtitle={stock.name}
                                    valueKind="stock"
                                    chartSeries={stock.chartSeries ?? []}
                                    latestPrice={stock.price}
                                    changePercent={stock.changePercent}
                                />
                            ))}
                        </DesktopScrollRow>
                    </div>
                </>
            ) : (
                <p className="text-sm text-text-tertiary py-4 text-center">No data available</p>
            )}

            {hasMoreStocks && (
                <Link
                    href="/markets"
                    className="flex items-center justify-center gap-1 min-h-[44px] text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
                >
                    View all on Markets
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden />
                </Link>
            )}
        </section>
    )
}
