
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
    getMarketBreadth,
    getSectorRollups,
    getWeekHighStocks,
    getWeekLowStocks,
    getConsistentGainerStocks,
    getRecentResults,
    getExpectedResults,
    getResultsCalendar,
    getNewsFeedMeta,
} from '@/lib/data'
import { HomeMarketOverview } from '@/components/home/HomeMarketOverview'
import { HomePersonalRail } from '@/components/home/HomePersonalRail'
import { NewsFeed } from '@/components/news/NewsFeed'

export const revalidate = 86400

export default async function HomePage() {
    const [
        gainersRaw,
        losersRaw,
        mostActiveRaw,
        weekHighs,
        weekLows,
        consistentGainers,
        indices,
        news,
        allInstruments,
        recentResults,
        expectedResults,
        resultsCalendar,
        newsMeta,
    ] = await Promise.all([
        getTopGainers(5),
        getTopLosers(5),
        getMostActive(5),
        getWeekHighStocks(5),
        getWeekLowStocks(5),
        getConsistentGainerStocks(5),
        getMarketIndices(),
        getLatestNews(4),
        getAllInstruments(),
        Promise.resolve(getRecentResults(8)),
        Promise.resolve(getExpectedResults(5)),
        Promise.resolve(getResultsCalendar()),
        Promise.resolve(getNewsFeedMeta()),
    ])

    const asOfDate = getMarketDataAsOf(allInstruments)
    const sentiment = getMarketSentiment(allInstruments)
    const breadth = getMarketBreadth()
    const sectors = getSectorRollups()

    const gainers = attachSparklines(gainersRaw)
    const losers = attachSparklines(losersRaw)
    const mostActive = attachSparklines(mostActiveRaw)

    return (
        <div className="pb-10 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-12 xl:grid-cols-[220px_minmax(0,1fr)_300px] gap-4 lg:gap-6 min-w-0">
                <HomePersonalRail variant="rail" className="hidden xl:block" />

                <div className="lg:col-span-8 xl:col-span-1 min-w-0 space-y-4">
                    <HomePersonalRail variant="compact" className="hidden lg:block xl:hidden" />
                    <HomeMarketOverview
                        indices={indices}
                        gainers={gainers}
                        losers={losers}
                        mostActive={mostActive}
                        weekHighs={weekHighs}
                        weekLows={weekLows}
                        consistentGainers={consistentGainers}
                        breadth={breadth}
                        sectors={sectors}
                        sentiment={sentiment}
                        asOfDate={asOfDate}
                        recentResults={recentResults}
                        expectedResults={expectedResults}
                        lastIssuerScan={newsMeta.lastIssuerScan ?? resultsCalendar.lastIssuerScan}
                        issuerCount={resultsCalendar.issuerCount}
                    />
                    <div className="lg:hidden min-w-0">
                        <NewsFeed items={news} layout="home" />
                    </div>
                </div>

                <aside className="hidden lg:block lg:col-span-4 xl:col-span-1 min-w-0 pl-6">
                    <NewsFeed items={news} layout="home-rail" />
                </aside>
            </div>
        </div>
    )
}
