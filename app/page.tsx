
import {
    getTopGainers,
    getTopLosers,
    getMostActive,
    getMarketIndices,
    getLatestNews,
    getMarketDataAsOf,
    getMarketSentiment,
    attachSparklines,
    getAllInstruments,
} from '@/lib/data'
import { HomePreviewTabs } from '@/components/home/HomePreviewTabs'
import { NewsFeed } from '@/components/news/NewsFeed'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { MarketSentimentStrip } from '@/components/markets/MarketSentimentStrip'

export const revalidate = 86400

export default async function HomePage() {
    const [gainersRaw, losersRaw, mostActiveRaw, indices, news, allInstruments] = await Promise.all([
        getTopGainers(5),
        getTopLosers(5),
        getMostActive(5),
        getMarketIndices(),
        getLatestNews(4),
        getAllInstruments(),
    ])

    const asOfDate = getMarketDataAsOf(allInstruments)
    const sentiment = getMarketSentiment(allInstruments)

    const gainers = attachSparklines(gainersRaw)
    const losers = attachSparklines(losersRaw)
    const mostActive = attachSparklines(mostActiveRaw)

    const marketColumn = (
        <div className="space-y-4 min-w-0">
            <MarketSentimentStrip
                sentiment={sentiment}
                asOfDate={asOfDate}
                hidePrimaryIndex
            />
            <HomePreviewTabs
                indices={indices}
                gainers={gainers}
                losers={losers}
                mostActive={mostActive}
            />
            <SponsorSlot placement="mobile-banner" />
        </div>
    )

    return (
        <div className="pb-10 min-w-0">
            <div className="grid grid-cols-1 min-[1152px]:grid-cols-12 min-[1152px]:gap-6 gap-4 min-w-0">
                <div className="min-[1152px]:col-span-8 min-w-0">{marketColumn}</div>
                <aside className="hidden min-[1152px]:block min-[1152px]:col-span-4 min-w-0 border-l border-border pl-6">
                    <NewsFeed items={news} layout="home-rail" />
                </aside>
            </div>
            <div className="min-[1152px]:hidden mt-4 min-w-0">
                <NewsFeed items={news} layout="home" />
            </div>
        </div>
    )
}
