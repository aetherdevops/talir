
import { Suspense } from 'react'
import { getTopGainers, getTopLosers, getMostActive, getMarketIndices, getLatestNews } from "@/lib/data"
import { IndexTicker } from "@/components/home/IndexTicker"
import { MarketStatus } from "@/components/home/MarketStatus"
import { TopMovers } from "@/components/home/TopMovers"
import { MarketTrends } from "@/components/home/MarketTrends"
import { NewsPreview } from "@/components/home/NewsPreview"
import { Button } from "@/components/ui/Button"
import { LayoutList } from "lucide-react"
import { HomePortfolioCard } from "@/components/home/HomePortfolioCard"

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
                        <div className="bg-gradient-to-br from-brand-600 to-indigo-700 rounded-xl p-4 text-white shadow-lg relative overflow-hidden group cursor-pointer min-w-[280px] flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <LayoutList className="h-24 w-24" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold mb-1 relative z-10">Talir Portfolio</h3>
                                <p className="text-brand-100 mb-2 relative z-10 text-xs leading-relaxed max-w-[200px]">
                                    Track investments & analyze performance.
                                </p>
                            </div>
                            <div className="relative z-10">
                                <HomePortfolioCard />
                            </div>
                        </div>
                    </IndexTicker>
                </section>

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
