
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
import { HomeTopMovers } from '@/components/home/HomeTopMovers'
import { MarketStatus } from '@/components/home/MarketStatus'
import { NewsFeed } from '@/components/news/NewsFeed'
import { SponsorSlot } from '@/components/sponsors/SponsorSlot'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
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

    return (
        <div className="space-y-6 pb-10">
            <div className="max-w-7xl mx-auto space-y-6 px-4 sm:px-6 lg:px-8">
                <section>
                    <HomePreviewTabs
                        indices={indices}
                        gainers={gainers}
                        losers={losers}
                        mostActive={mostActive}
                    />
                </section>

                <MarketSentimentStrip sentiment={sentiment} asOfDate={asOfDate} />

                <HomeTopMovers gainers={gainers} losers={losers} />

                <SponsorSlot placement="mobile-in-flow" className="md:hidden" />

                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                    <MarketStatus asOfDate={asOfDate} />
                    <DataFreshnessLabel asOfDate={asOfDate} className="sm:text-right" />
                </div>

                <NewsFeed items={news} layout="home" />
            </div>
        </div>
    )
}
