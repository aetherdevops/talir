
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
    getRecentDividends,
    getUpcomingExDates,
    getNewsFeedMeta,
} from '@/lib/data'
import { HomeMarketOverview } from '@/components/home/HomeMarketOverview'
import { HomeDividendsPanel } from '@/components/dividends/HomeDividendsPanel'

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
        recentDividends,
        upcomingExDates,
        newsMeta,
    ] = await Promise.all([
        getTopGainers(5),
        getTopLosers(5),
        getMostActive(5),
        getWeekHighStocks(5),
        getWeekLowStocks(5),
        getConsistentGainerStocks(5),
        getMarketIndices(),
        getLatestNews(8),
        getAllInstruments(),
        Promise.resolve(getRecentResults(5)),
        Promise.resolve(getExpectedResults(5)),
        Promise.resolve(getRecentDividends(5)),
        Promise.resolve(getUpcomingExDates(5)),
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
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] gap-4 lg:gap-6 min-w-0">
                <div className="min-w-0 space-y-4">
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
                        news={news}
                        recentResults={recentResults}
                        expectedResults={expectedResults}
                        recentDividends={recentDividends}
                        upcomingExDates={upcomingExDates}
                        lastIssuerScan={newsMeta.lastIssuerScan}
                    />
                </div>

                <aside className="hidden lg:block min-w-0">
                    <HomeDividendsPanel
                        recent={recentDividends}
                        upcoming={upcomingExDates}
                        variant="aside"
                    />
                </aside>
            </div>
        </div>
    )
}
