import {
    getTopGainers,
    getTopLosers,
    getMostActive,
    getMarketIndices,
    getIndexDetails,
    getLatestNews,
    getMarketDataAsOf,
    getMarketSentiment,
    attachSparklines,
    getAllInstruments,
    getMarketBreadth,
    getWeekHighStocks,
    getWeekLowStocks,
    getConsistentGainerStocks,
    getRecentResults,
    getExpectedResults,
    getDividendsCalendar,
    getNewsFeedMeta,
} from '@/lib/data'
import { buildMbi10DividendHighlights } from '@/lib/dividend-home-banner'
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
        mbi10,
        news,
        allInstruments,
        recentResults,
        expectedResults,
        newsMeta,
    ] = await Promise.all([
        getTopGainers(5),
        getTopLosers(5),
        getMostActive(5),
        getWeekHighStocks(5),
        getWeekLowStocks(5),
        getConsistentGainerStocks(5),
        getMarketIndices(),
        getIndexDetails('MBI10'),
        getLatestNews(8),
        getAllInstruments(),
        Promise.resolve(getRecentResults(5)),
        Promise.resolve(getExpectedResults(5)),
        Promise.resolve(getNewsFeedMeta()),
    ])

    const asOfDate = getMarketDataAsOf(allInstruments)
    const sentiment = getMarketSentiment(allInstruments)
    const breadth = getMarketBreadth()

    const gainers = attachSparklines(gainersRaw)
    const losers = attachSparklines(losersRaw)
    const mostActive = attachSparklines(mostActiveRaw)

    const priceByCode: Record<string, number> = {}
    for (const stock of allInstruments) {
        if (stock.type !== 'Index' && stock.price > 0) {
            priceByCode[stock.code] = stock.price
        }
    }

    const dividendHighlights = buildMbi10DividendHighlights({
        byIssuer: getDividendsCalendar().byIssuer,
        priceByCode,
        limit: 5,
    })

    return (
        <div className="pb-10 min-w-0">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_min(100%,22rem)] gap-4 lg:gap-6 min-w-0">
                <div className="min-w-0 space-y-4">
                    <HomeMarketOverview
                        indices={indices}
                        mbi10={mbi10}
                        gainers={gainers}
                        losers={losers}
                        mostActive={mostActive}
                        weekHighs={weekHighs}
                        weekLows={weekLows}
                        consistentGainers={consistentGainers}
                        breadth={breadth}
                        sentiment={sentiment}
                        asOfDate={asOfDate}
                        news={news}
                        recentResults={recentResults}
                        expectedResults={expectedResults}
                        dividendHighlights={dividendHighlights}
                        lastIssuerScan={newsMeta.lastIssuerScan}
                    />
                </div>

                <aside className="hidden lg:block min-w-0">
                    <HomeDividendsPanel highlights={dividendHighlights} variant="aside" />
                </aside>
            </div>
        </div>
    )
}
