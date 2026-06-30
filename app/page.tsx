
import { Suspense } from 'react'
import { getTopGainers, getTopLosers, getMostActive, getMarketIndices, getLatestNews } from "@/lib/data"
import { IndexTicker } from "@/components/home/IndexTicker"
import { MarketStatus } from "@/components/home/MarketStatus"
import { TopMovers } from "@/components/home/TopMovers"
import { MarketTrends } from "@/components/home/MarketTrends"
import { NewsPreview } from "@/components/home/NewsPreview"
import { HomePortfolioCard } from "@/components/home/HomePortfolioCard"
import { SponsorSlot } from "@/components/sponsors/SponsorSlot"

export const revalidate = 60 // Revalidate every minute

export default async function HomePage() {
    const [gainers, losers, mostActive, indices, news] = await Promise.all([
        getTopGainers(5),
        getTopLosers(5),
        getMostActive(5),
        getMarketIndices(),
        getLatestNews(4)
    ])

    return (
        <div className="space-y-8 pb-10">
            <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
                {/* Ticker & Portfolio Section */}
                <section className="animate-fade-in">
                    <IndexTicker indices={indices}>
                        <div className="rounded-xl border border-border bg-surface p-4 min-w-[280px] flex flex-col justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-semibold text-text-primary">Talir Portfolio</h3>
                                <p className="text-text-secondary text-xs leading-relaxed mt-1 max-w-[200px]">
                                    Track investments and analyze performance.
                                </p>
                            </div>
                            <HomePortfolioCard />
                        </div>
                    </IndexTicker>
                </section>

                <SponsorSlot placement="mobile-in-flow" className="md:hidden" />

                {/* Status Bar */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
                    <MarketStatus />
                    <div className="text-xs text-text-tertiary">
                        Market updated daily
                    </div>
                </div>

                {/* Main Content - Full Width Stack */}
                <div className="flex flex-col gap-10">
                    <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <MarketTrends gainers={gainers} losers={losers} mostActive={mostActive} />
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <NewsPreview news={news} />
                    </div>
                </div>
            </div>
        </div>
    )
}
