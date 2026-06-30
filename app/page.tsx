
import { getTopGainers, getTopLosers, getMostActive, getMarketIndices, getLatestNews, enrichStocksWithChartSeries } from "@/lib/data"
import { HomePreviewTabs } from "@/components/home/HomePreviewTabs"
import { MarketStatus } from "@/components/home/MarketStatus"
import { MarketTrends } from "@/components/home/MarketTrends"
import { NewsFeed } from "@/components/news/NewsFeed"
import { HomePortfolioCard } from "@/components/home/HomePortfolioCard"
import { SponsorSlot } from "@/components/sponsors/SponsorSlot"

export const revalidate = 60 // Revalidate every minute

const portfolioSlot = (
    <div className="rounded-xl border border-border bg-surface p-4 min-w-[280px] max-w-[300px] flex flex-col justify-between gap-3">
        <div>
            <h3 className="text-lg font-semibold text-text-primary">Talir Portfolio</h3>
            <p className="text-text-secondary text-xs leading-relaxed mt-1 max-w-[200px]">
                Track investments and analyze performance.
            </p>
        </div>
        <HomePortfolioCard />
    </div>
)

export default async function HomePage() {
    const [gainersRaw, losersRaw, mostActiveRaw, indices, news] = await Promise.all([
        getTopGainers(5),
        getTopLosers(5),
        getMostActive(5),
        getMarketIndices(),
        getLatestNews(4)
    ])

    const [gainers, losers, mostActive] = await Promise.all([
        enrichStocksWithChartSeries(gainersRaw),
        enrichStocksWithChartSeries(losersRaw),
        enrichStocksWithChartSeries(mostActiveRaw),
    ])

    return (
        <div className="space-y-8 pb-10">
            <div className="max-w-7xl mx-auto space-y-8 px-4 sm:px-6 lg:px-8">
                <section className="animate-fade-in">
                    <HomePreviewTabs
                        indices={indices}
                        gainers={gainers}
                        losers={losers}
                        mostActive={mostActive}
                        portfolioSlot={portfolioSlot}
                    />
                </section>

                <SponsorSlot placement="mobile-in-flow" className="md:hidden" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-slide-up">
                    <MarketStatus />
                    <div className="text-xs text-text-tertiary">
                        Market updated daily
                    </div>
                </div>

                <div className="flex flex-col gap-10">
                    <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                        <MarketTrends gainers={gainersRaw} losers={losersRaw} mostActive={mostActiveRaw} />
                    </div>

                    <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                        <NewsFeed items={news} layout="home" />
                    </div>
                </div>
            </div>
        </div>
    )
}
