import { StockData, StockSummary, DailyPrice, MarketIndex, NewsItem, NewsFeedFile } from './types'
export type { StockData, StockSummary, DailyPrice, MarketIndex, NewsItem, NewsFeedFile }
import { getIssuerDisplayName, getIssuerMarketCapThousands } from './issuer-display-name'
import { CHANGE_ZERO_THRESHOLD, classifyChangePercent } from './utils'
import { isExcludedEquityCode, isMseEquityInstrument } from './market-universe'
import { adjustStockHistory } from './corporate-actions'

// Static Data Imports (Bundled) - Using @/lib/data guaranteed to be in the build
import marketSummaryData from '@/lib/data/market_summary.json'
import issuersData from '@/lib/data/issuers.json'
import sparklinesData from '@/lib/data/sparklines.json'
import derivedMarketData from '@/lib/data/derived_market.json'
import scrapeMetaData from '@/lib/data/scrape_meta.json'
import searchIndexData from '@/lib/data/search_index.json'
import newsFeedData from '@/lib/data/news_feed.json'
import resultsCalendarData from '@/lib/data/derived_results_calendar.json'
import dividendsCalendarData from '@/lib/data/derived_dividends.json'
import fundamentalsData from '@/lib/data/derived_fundamentals.json'
import macroDashboardData from '@/lib/data/derived_macro.json'
import type {
    ExpectedResultsEntry,
    ResultsCalendarEntry,
    ResultsCalendarFile,
} from './results-calendar'
import type { DividendCalendarEntry, DividendsCalendarFile } from './dividends'
import type { FundamentalEntry, FundamentalsFile } from './fundamentals'
import type { MacroFile } from './macro'
import type {
    BreadthHistoryPoint,
    DerivedBreadth,
    DerivedSectorRollup,
    MarketSentiment,
    SearchIndexItem,
    SparklineMap,
} from './market-derived-types'
export type {
    BreadthHistoryPoint,
    DerivedBreadth,
    DerivedSectorRollup,
    MarketSentiment,
    SearchIndexItem,
    SparklineMap,
} from './market-derived-types'
export type { ExpectedResultsEntry, ResultsCalendarEntry, ResultsCalendarFile }
export type { DividendCalendarEntry, DividendsCalendarFile }
export type { FundamentalEntry, FundamentalsFile }
export type { MacroFile }

// Unified fetcher for both stocks and indices
export async function getAllInstruments(): Promise<StockSummary[]> {
    const [stocks, indices] = await Promise.all([
        getAllStocks(),
        getMarketIndices()
    ])

    const indexItems: StockSummary[] = indices.map(idx => ({
        code: idx.name,
        name: idx.name,
        price: idx.value,
        change: idx.change,
        changePercent: idx.changePercent,
        volume: 0,
        turnover: 0,
        date: idx.chartSeries?.length
            ? idx.chartSeries[idx.chartSeries.length - 1].date
            : new Date().toISOString().split('T')[0],
        type: 'Index' as const,
        chartSeries: idx.chartSeries?.slice(-30),
    }))

    return [...indexItems, ...stocks]
}

// Fetch all stocks summary (prefers precomputed derived_market.json)
export async function getAllStocks(): Promise<StockSummary[]> {
    try {
        const derived = derivedMarketData as {
            instruments?: Array<{
                code: string
                name: string
                price: number
                change: number
                changePercent: number
                volume: number
                turnover: number
                date: string
                sector?: string | null
                marketCapThousandsMkd?: number
                yoyPricePercent?: number
            }>
        }

        if (derived.instruments?.length) {
            const sparklines = getMarketSparklines()
            return derived.instruments
                .map((item) => ({
                    code: item.code,
                    name: item.name || '',
                    price: item.price,
                    change: item.change,
                    changePercent: item.changePercent,
                    volume: item.volume || 0,
                    turnover: item.turnover || 0,
                    date: item.date,
                    type: 'Stock' as const,
                    chartSeries: sparklines[item.code],
                    sector: item.sector || undefined,
                    marketCapThousandsMkd: item.marketCapThousandsMkd,
                    yoyPricePercent: item.yoyPricePercent,
                }))
                .filter((s) => s.price > 0 || s.volume > 0)
        }

        const data = marketSummaryData as any[]
        if (!data) return []

        return data.map((item: any) => ({
            code: item.code,
            name: item.name || '',
            price: item.price,
            change: 0,
            changePercent: item.change_pct || 0,
            volume: item.volume || 0,
            turnover: item.turnover || 0,
            date: item.date,
            type: 'Stock' as const,
        })).filter((s) => s.price > 0 || s.volume > 0)
    } catch (e) {
        console.error("Error getting all stocks", e)
        return []
    }
}

/** Same-sector peers ranked by turnover (EOD). */
export async function getRelatedStocksBySector(
    code: string,
    sector: string | undefined,
    limit = 4
): Promise<StockSummary[]> {
    if (!sector) return []

    const [all, issuers] = await Promise.all([getAllStocks(), getIssuers()])
    const sectorByCode = new Map(issuers.map((i: { code: string; sector?: string }) => [i.code, i.sector]))

    return all
        .filter((s) => s.code !== code && sectorByCode.get(s.code) === sector)
        .sort((a, b) => {
            const capA = a.marketCapThousandsMkd ?? getIssuerMarketCapThousands(a.code) ?? 0
            const capB = b.marketCapThousandsMkd ?? getIssuerMarketCapThousands(b.code) ?? 0
            if (capB !== capA) return capB - capA
            return b.turnover - a.turnover
        })
        .slice(0, limit)
}

// Fetch all issuers (cached in memory for the lambda lifetime)
let issuersCache: any[] | null = null;

async function getIssuers(): Promise<any[]> {
    if (issuersCache) return issuersCache;
    try {
        issuersCache = issuersData as any[] || [];
        return issuersCache;
    } catch (e) {
        console.error("Error loading issuers", e);
        return [];
    }
}

// Fetch single stock details
export async function getStock(code: string): Promise<StockData | null> {
    try {
        const [stockModule, issuers] = await Promise.all([
            // Use dynamic import from lib/data (source code) so webpack bundles it
            import(`@/lib/data/stocks/${code}.json`),
            getIssuers()
        ]);

        const stock = stockModule.default as any

        if (!stock) return null

        // Raw MSE history is never rebased for splits — do it here so charts, ranges and
        // multi-year returns stay comparable across a split.
        const rawHistory: DailyPrice[] = Array.isArray(stock.history) ? stock.history : []
        const history: DailyPrice[] = adjustStockHistory(code, rawHistory)

        // Find issuer data
        const issuerDetails = issuers.find((i: any) => i.code === code);

        const latinName = stock.company_name || issuerDetails?.name || code
        const nameMk = getIssuerDisplayName('mk', code, latinName)

        // Merge scraped issuer data with any existing data
        const mergedIssuerData = {
            ...stock.issuer_data,
            ...issuerDetails,
            company_name: latinName,
            name: latinName,
        };

        return {
            company_code: stock.company_code,
            company_name: latinName,
            company_name_original: nameMk,
            sector: issuerDetails?.sector || undefined,
            history: history,
            first_trade_date: history.length > 0 ? history[0].date : '',
            issuer_data: mergedIssuerData
        }
    } catch (e) {
        console.error(`Error getting stock ${code}`, e)
        return null
    }
}

export function rankTopGainers(stocks: StockSummary[], limit: number): StockSummary[] {
    return stocks
        .filter((s) => s.changePercent >= CHANGE_ZERO_THRESHOLD)
        .sort((a, b) => b.changePercent - a.changePercent)
        .slice(0, limit)
}

export function rankTopLosers(stocks: StockSummary[], limit: number): StockSummary[] {
    return stocks
        .filter((s) => s.changePercent <= -CHANGE_ZERO_THRESHOLD)
        .sort((a, b) => a.changePercent - b.changePercent)
        .slice(0, limit)
}

export async function getTopGainers(limit: number = 5): Promise<StockSummary[]> {
    const all = await getAllStocks()
    return rankTopGainers(all, limit)
}

export async function getTopLosers(limit: number = 5): Promise<StockSummary[]> {
    const all = await getAllStocks()
    return rankTopLosers(all, limit)
}

export async function getMostActive(limit: number = 5): Promise<StockSummary[]> {
    const all = await getAllStocks()
    return all.sort((a, b) => b.turnover - a.turnover).slice(0, limit)
}

type DerivedMarketFile = {
    asOfDate?: string
    breadth?: DerivedBreadth
    leaderboards?: {
        weekHighs?: string[]
        weekLows?: string[]
        consistentGainers?: string[]
    }
    sectors?: DerivedSectorRollup[]
}

function getDerivedMarketFile(): DerivedMarketFile {
    return derivedMarketData as DerivedMarketFile
}

export function getMarketBreadth(): DerivedBreadth | null {
    const derived = getDerivedMarketFile()
    const breadth = derived.breadth
    if (!breadth?.history?.length) return null
    return breadth
}

export function getSectorRollups(): DerivedSectorRollup[] {
    const derived = getDerivedMarketFile()
    return derived.sectors ?? []
}

async function resolveStocksByCodes(codes: string[]): Promise<StockSummary[]> {
    if (!codes.length) return []
    const all = await getAllStocks()
    const byCode = new Map(all.map((stock) => [stock.code, stock]))
    return codes
        .map((code) => byCode.get(code))
        .filter((stock): stock is StockSummary => stock != null)
}

export async function getWeekHighStocks(limit = 5): Promise<StockSummary[]> {
    const codes = getDerivedMarketFile().leaderboards?.weekHighs ?? []
    return attachSparklines(await resolveStocksByCodes(codes.slice(0, limit)))
}

export async function getWeekLowStocks(limit = 5): Promise<StockSummary[]> {
    const codes = getDerivedMarketFile().leaderboards?.weekLows ?? []
    return attachSparklines(await resolveStocksByCodes(codes.slice(0, limit)))
}

export async function getConsistentGainerStocks(limit = 5): Promise<StockSummary[]> {
    const codes = getDerivedMarketFile().leaderboards?.consistentGainers ?? []
    return attachSparklines(await resolveStocksByCodes(codes.slice(0, limit)))
}

export async function enrichStocksWithChartSeries(stocks: StockSummary[]): Promise<StockSummary[]> {
    return Promise.all(
        stocks.map(async (stock) => {
            if (stock.chartSeries?.length) return stock
            const data = await getStock(stock.code)
            if (!data?.history?.length) {
                return { ...stock, chartSeries: [] }
            }
            const chartSeries = getChartData(data.history, 12).map((d) => ({
                date: d.time,
                value: d.value,
            }))
            return { ...stock, chartSeries }
        })
    )
}

/** Last N trading-day closes for inline sparklines. */
export function getRecentDailyCloses(history: DailyPrice[], tradingDays = 30) {
    if (!history?.length) return []

    const uniqueMap = new Map<string, number>()
    history.forEach((item) => {
        const d = new Date(item.date)
        const key = d.toISOString().split('T')[0]
        uniqueMap.set(key, item.last_transaction_price)
    })

    return Array.from(uniqueMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-tradingDays)
        .map(([date, value]) => ({ date, value }))
}

export function getMarketSentiment(stocks: StockSummary[]): MarketSentiment {
    const derived = derivedMarketData as {
        sentiment?: { advancers: number; decliners: number; unchanged: number }
    }

    const mbi10 = stocks.find((s) => s.code === 'MBI10')

    if (derived.sentiment) {
        return {
            advancers: derived.sentiment.advancers,
            decliners: derived.sentiment.decliners,
            unchanged: derived.sentiment.unchanged,
            primaryIndex: mbi10
                ? { name: mbi10.code, value: mbi10.price, changePercent: mbi10.changePercent }
                : undefined,
        }
    }

    let advancers = 0
    let decliners = 0
    let unchanged = 0

    for (const s of stocks) {
        if (s.type === 'Index' || !isMseEquityInstrument(s.code, s.price, s.volume, s.turnover)) continue
        const direction = classifyChangePercent(s.changePercent)
        if (direction === 'up') advancers++
        else if (direction === 'down') decliners++
        else unchanged++
    }

    return {
        advancers,
        decliners,
        unchanged,
        primaryIndex: mbi10
            ? { name: mbi10.code, value: mbi10.price, changePercent: mbi10.changePercent }
            : undefined,
    }
}

export function getMarketDataAsOf(stocks: StockSummary[]): string {
    const meta = scrapeMetaData as ScrapeMeta
    if (meta.asOfDate) return meta.asOfDate

    const dates = stocks
        .map((s) => s.date)
        .filter(Boolean)
        .sort()
    return dates.length > 0 ? dates[dates.length - 1] : new Date().toISOString().split('T')[0]
}

export type ScrapeMeta = {
    asOfDate?: string
    status?: 'ok' | 'partial' | 'failed'
    generatedAt?: string
    instrumentCount?: number
    errors?: string[]
}

export function getScrapeMeta(): ScrapeMeta {
    return scrapeMetaData as ScrapeMeta
}

export function getSearchIndex(): SearchIndexItem[] {
    const index = searchIndexData as { items?: SearchIndexItem[] }
    return index.items ?? []
}

export function attachSparklines(stocks: StockSummary[]): StockSummary[] {
    const sparklines = getMarketSparklines()
    return stocks.map((s) => ({
        ...s,
        chartSeries: s.chartSeries?.length ? s.chartSeries : sparklines[s.code] ?? [],
    }))
}

/** Precomputed 30-day sparklines — see scripts/generate-sparklines.mjs */
export function getMarketSparklines(): SparklineMap {
    return sparklinesData as SparklineMap
}

// Chart Data Helper
export function getChartData(history: DailyPrice[], months: number = 12) {
    if (!history || history.length === 0) return []

    const cutoff = new Date()
    cutoff.setMonth(cutoff.getMonth() - months)

    // Dedup by date string (handling potentially different formats like 2025-9-1 and 2025-09-01)
    const uniqueMap = new Map<string, DailyPrice>()
    history.forEach(item => {
        // Normalize date to YYYY-MM-DD
        const d = new Date(item.date)
        const key = d.toISOString().split('T')[0]
        if (!uniqueMap.has(key)) {
            uniqueMap.set(key, item)
        }
    })

    return Array.from(uniqueMap.values())
        .map(d => ({
            time: new Date(d.date).toISOString().split('T')[0],
            value: d.last_transaction_price,
            volume: d.quantity
        }))
        .filter(d => new Date(d.time) >= cutoff)
        .sort((a, b) => a.time.localeCompare(b.time))
}

export function getNewsFeed(): NewsFeedFile {
    return newsFeedData as NewsFeedFile
}

export function getNewsFeedMeta(): { lastIssuerScan: string | null } {
    const feed = getNewsFeed()
    return { lastIssuerScan: feed.lastIssuerScan ?? null }
}

export function getCompanyFilings(stockCode: string): { dated: NewsItem[]; undated: NewsItem[] } {
    const feed = getNewsFeed()
    return {
        dated: feed.items.filter((item) => item.stockCode === stockCode),
        undated: feed.undatedByCode?.[stockCode] ?? [],
    }
}

export function getResultsCalendar(): ResultsCalendarFile {
    return resultsCalendarData as ResultsCalendarFile
}

export function getRecentResults(limit = 8): ResultsCalendarEntry[] {
    return getResultsCalendar().recent.slice(0, limit)
}

export function getAllResults(): ResultsCalendarEntry[] {
    return getResultsCalendar().all
}

export function getExpectedResults(limit?: number): ExpectedResultsEntry[] {
    const expected = getResultsCalendar().expected
    return limit ? expected.slice(0, limit) : expected
}

export function getResultsForIssuer(stockCode: string): ResultsCalendarEntry[] {
    return getResultsCalendar().byIssuer[stockCode] ?? []
}

export function getExpectedForIssuer(stockCode: string): ExpectedResultsEntry[] {
    return getResultsCalendar().expected.filter((entry) => entry.stockCode === stockCode)
}

export function getDividendsCalendar(): DividendsCalendarFile {
    return dividendsCalendarData as DividendsCalendarFile
}

export function getRecentDividends(limit = 8): DividendCalendarEntry[] {
    return getDividendsCalendar().recent.slice(0, limit)
}

export function getAllDividends(): DividendCalendarEntry[] {
    return getDividendsCalendar().all
}

export function getUpcomingExDates(limit?: number): DividendCalendarEntry[] {
    const upcoming = getDividendsCalendar().upcomingExDates
    return limit ? upcoming.slice(0, limit) : upcoming
}

export function getDividendsForIssuer(stockCode: string): DividendCalendarEntry[] {
    return getDividendsCalendar().byIssuer[stockCode] ?? []
}

/** First trade date per ticker from bundled EOD history (for dividend scorecards). */
export async function getFirstTradeDateByCode(codes: string[]): Promise<Record<string, string>> {
    const result: Record<string, string> = {}
    const unique = [...new Set(codes)]

    await Promise.all(
        unique.map(async (code) => {
            try {
                const stockModule = await import(`@/lib/data/stocks/${code}.json`)
                const stock = stockModule.default as { history?: { date: string }[] }
                const first = stock.history?.[0]?.date
                if (first) result[code] = first
            } catch {
                // Missing history file — skip
            }
        })
    )

    return result
}

export function getFundamentalsCalendar(): FundamentalsFile {
    return fundamentalsData as FundamentalsFile
}

export function getFundamentalsForIssuer(stockCode: string): FundamentalEntry[] {
    return getFundamentalsCalendar().byIssuer[stockCode] ?? []
}

/** Macro dashboard — dummy series until MakStat / NBRM are wired. */
export function getMacroDashboard(): MacroFile {
    return macroDashboardData as MacroFile
}

export async function getLatestNews(limit: number = 6, stockCode?: string): Promise<NewsItem[]> {
    try {
        let items = getNewsFeed().items
        if (stockCode) {
            items = items.filter((item) => item.stockCode === stockCode)
        }
        return items.slice(0, limit)
    } catch (e) {
        console.error('Error loading news feed', e)
        return []
    }
}

export interface IndexDetails {
    code: string
    name: string
    currentValue: number
    change: number
    changePercent: number
    history: { date: string; value: number }[]
    dayRange: { min: number; max: number } | null
    yearRange: { min: number; max: number } | null
}

export async function getIndexDetails(code: string): Promise<IndexDetails | null> {
    try {
        const module = await import(`@/lib/data/indices/${code}.json`)
        const data = module.default as any[]

        if (!data || data.length === 0) return null

        // Sort by date ascending for history
        const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

        const latest = sorted[sorted.length - 1]
        const prev = sorted.length > 1 ? sorted[sorted.length - 2] : latest

        const change = latest.value - prev.value
        const changePercent = prev.value !== 0 ? (change / prev.value) * 100 : 0

        // 52 Week Range
        const oneYearAgo = new Date();
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
        const lastYearData = sorted.filter(d => new Date(d.date) >= oneYearAgo);

        let yearMin = Infinity;
        let yearMax = -Infinity;

        lastYearData.forEach(d => {
            if (d.value < yearMin) yearMin = d.value;
            if (d.value > yearMax) yearMax = d.value;
        });

        if (yearMin === Infinity) yearMin = latest.value;
        if (yearMax === -Infinity) yearMax = latest.value;

        return {
            code,
            name: code, // MBI10 or OMB
            currentValue: latest.value,
            change,
            changePercent,
            history: sorted.map(d => ({ date: d.date, value: d.value })),
            dayRange: null, // Scraper doesn't provide intraday High/Low
            yearRange: { min: yearMin, max: yearMax }
        }
    } catch (e) {
        console.error(`Error loading index details for ${code}`, e)
        return null
    }
}

export async function getMarketIndices(): Promise<MarketIndex[]> {
    try {
        const [mbi10Module, ombModule] = await Promise.all([
            import('@/lib/data/indices/MBI10.json'),
            import('@/lib/data/indices/OMB.json')
        ])

        const mbi10Data = mbi10Module.default as Array<{ date: string; value: number }>
        const ombData = ombModule.default as Array<{ date: string; value: number }>

        const oneYearAgo = new Date()
        oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1)

        const buildIndex = (name: string, data: Array<{ date: string; value: number }>): MarketIndex | null => {
            if (!data || data.length === 0) return null
            const latest = data[data.length - 1]
            const prev = data.length > 1 ? data[data.length - 2] : latest
            const change = latest.value - prev.value
            const changePercent = prev.value !== 0 ? (change / prev.value) * 100 : 0
            const chartSeries = data
                .filter((d) => new Date(d.date) >= oneYearAgo)
                .map((d) => ({ date: d.date, value: d.value }))

            return {
                name,
                value: latest.value,
                change,
                changePercent,
                chartSeries: chartSeries.length > 0 ? chartSeries : data.slice(-252).map((d) => ({ date: d.date, value: d.value })),
            }
        }

        const indices: MarketIndex[] = []
        const mbi10 = buildIndex('MBI10', mbi10Data)
        const omb = buildIndex('OMB', ombData)
        if (mbi10) indices.push(mbi10)
        if (omb) indices.push(omb)

        return indices
    } catch (e) {
        console.error("Error loading indices", e)
        return []
    }
}
