'use client'

import { useState } from 'react'
import { MarketIndex, StockSummary } from '@/lib/types'
import { cn } from '@/lib/utils'
import { PreviewMarketCard } from '@/components/home/PreviewMarketCard'
import { CompactQuoteCard } from '@/components/home/CompactQuoteCard'
import { DesktopScrollRow } from '@/components/home/DesktopScrollRow'
import { StockPreviewCard } from '@/components/home/StockPreviewCard'
import { IssuerDisplayName } from '@/components/common/IssuerDisplayName'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import { ChevronRight } from 'lucide-react'

type MainTab = 'indices' | 'stocks'
type StockTab = 'active' | 'gainers' | 'losers'

const MAX_PREVIEW_ITEMS = 6

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

function ViewAllLink({ href, label }: { href: string; label: string }) {
    return (
        <LocaleLink
            href={href}
            className="flex items-center justify-center gap-1 min-h-[44px] text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
        >
            {label}
            <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        </LocaleLink>
    )
}

export function HomePreviewTabs({
    indices,
    gainers,
    losers,
    mostActive,
}: HomePreviewTabsProps) {
    const { t } = useLocale()
    const [mainTab, setMainTab] = useState<MainTab>('indices')
    const [stockTab, setStockTab] = useState<StockTab>('active')

    const stockLists: Record<StockTab, StockSummary[]> = {
        gainers,
        losers,
        active: mostActive,
    }
    const activeStocks = stockLists[stockTab]
    const previewIndices = indices.slice(0, MAX_PREVIEW_ITEMS)
    const previewStocks = activeStocks.slice(0, MAX_PREVIEW_ITEMS)
    const hasMoreIndices = indices.length > MAX_PREVIEW_ITEMS
    const hasMoreStocks = activeStocks.length > MAX_PREVIEW_ITEMS

    return (
        <div className="space-y-2 min-w-0">
            <TabPills
                options={[
                    { id: 'indices', label: t('home.indices') },
                    { id: 'stocks', label: t('home.stocks') },
                ]}
                value={mainTab}
                onChange={setMainTab}
            />

            {mainTab === 'indices' && (
                <div className="space-y-2 min-w-0">
                    <div className="lg:hidden">
                        <PreviewGrid>
                            {previewIndices.map((idx) => (
                                <PreviewMarketCard
                                    key={idx.name}
                                    href={`/market/${idx.name}`}
                                    label={idx.name}
                                    valueKind="index"
                                    chartSeries={(idx.chartSeries ?? []).slice(-30)}
                                    latestPrice={idx.value}
                                    changePercent={idx.changePercent}
                                />
                            ))}
                        </PreviewGrid>
                    </div>
                    <div className="hidden lg:block min-w-0">
                        <DesktopScrollRow>
                            {previewIndices.map((idx) => (
                                <CompactQuoteCard
                                    key={idx.name}
                                    href={`/market/${idx.name}`}
                                    label={idx.name}
                                    valueKind="index"
                                    chartSeries={(idx.chartSeries ?? []).slice(-30)}
                                    latestPrice={idx.value}
                                    changePercent={idx.changePercent}
                                />
                            ))}
                        </DesktopScrollRow>
                    </div>
                    {previewIndices.length === 0 && (
                        <p className="text-sm text-text-tertiary py-4 text-center">{t('home.noIndexData')}</p>
                    )}
                    {hasMoreIndices && <ViewAllLink href="/markets" label={t('home.viewAllIndices')} />}
                </div>
            )}

            {mainTab === 'stocks' && (
                <div className="space-y-2 min-w-0">
                    <TabPills
                        options={[
                            { id: 'active', label: t('home.active') },
                            { id: 'gainers', label: t('home.gainers') },
                            { id: 'losers', label: t('home.losers') },
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
                                            subtitle={
                                                <IssuerDisplayName code={stock.code} name={stock.name} />
                                            }
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
                        <p className="text-sm text-text-tertiary py-4 text-center">{t('home.noData')}</p>
                    )}
                    {hasMoreStocks && <ViewAllLink href="/markets" label={t('home.viewAllStocks')} />}
                </div>
            )}
        </div>
    )
}
