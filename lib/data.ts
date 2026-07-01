import { StockData, StockSummary, DailyPrice, MarketIndex, NewsItem } from './types'
export type { StockData, StockSummary, DailyPrice, MarketIndex, NewsItem }
import { buildNewsFromIssuers } from './news'
import { transliterate } from './transliterate'

// Static Data Imports (Bundled) - Using @/lib/data guaranteed to be in the build
import marketSummaryData from '@/lib/data/market_summary.json'
import issuersData from '@/lib/data/issuers.json'
import sparklinesData from '@/lib/data/sparklines.json'
import derivedMarketData from '@/lib/data/derived_market.json'
import scrapeMetaData from '@/lib/data/scrape_meta.json'
import searchIndexData from '@/lib/data/search_index.json'

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

        // Process history to standard format
        const history: DailyPrice[] = Array.isArray(stock.history) ? stock.history : []

        // Find issuer data
        const issuerDetails = issuers.find((i: any) => i.code === code);

        // Merge scraped issuer data with any existing data
        const mergedIssuerData = {
            ...stock.issuer_data,
            ...issuerDetails,
            company_name: stock.company_name || issuerDetails?.name, // Prefer file source of truth
            name: stock.company_name || issuerDetails?.name, // Ensure 'name' is also consistent
        };

        return {
            company_code: stock.company_code,
            company_name: stock.company_name,
            company_name_original: stock.company_name,
            history: history,
            first_trade_date: history.length > 0 ? history[0].date : '',
            issuer_data: mergedIssuerData
        }
    } catch (e) {
        console.error(`Error getting stock ${code}`, e)
        return null
    }
}

export async function getTopGainers(limit: number = 5): Promise<StockSummary[]> {
    const all = await getAllStocks()
    return all.sort((a, b) => b.changePercent - a.changePercent).slice(0, limit)
}

export async function getTopLosers(limit: number = 5): Promise<StockSummary[]> {
    const all = await getAllStocks()
    return all.sort((a, b) => a.changePercent - b.changePercent).slice(0, limit)
}

export async function getMostActive(limit: number = 5): Promise<StockSummary[]> {
    const all = await getAllStocks()
    return all.sort((a, b) => b.turnover - a.turnover).slice(0, limit)
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

export interface MarketSentiment {
    advancers: number
    decliners: number
    unchanged: number
    primaryIndex?: { name: string; value: number; changePercent: number }
}

export function getMarketSentiment(stocks: StockSummary[]): MarketSentiment {
    const equities = stocks.filter((s) => s.type !== 'Index')
    let advancers = 0
    let decliners = 0
    let unchanged = 0

    for (const s of equities) {
        if (s.changePercent > 0) advancers++
        else if (s.changePercent < 0) decliners++
        else unchanged++
    }

    const mbi10 = stocks.find((s) => s.code === 'MBI10')
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

export type SearchIndexItem = {
    code: string
    name: string
    type: 'Stock' | 'Index'
    q: string
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

export type SparklineMap = Record<string, { date: string; value: number }[]>

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

// Helper to parse date from title if date field is empty or standard
// Title format example: "10/30/2025 - Komercijalna Banka..."
function parseDateFromTitle(title: string, dateStr?: string): Date {
    if (dateStr) return new Date(dateStr)

    // Try extracting MM/DD/YYYY from start of title
    const match = title.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (match) {
        return new Date(`${match[3]}-${match[1]}-${match[2]}`)
    }
    return new Date() // Fallback
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

export async function getLatestNews(limit: number = 6, stockCode?: string): Promise<NewsItem[]> {
    try {
        const issuers = await getIssuers()
        return buildNewsFromIssuers(issuers, limit, parseDateFromTitle, stockCode)
    } catch (e) {
        console.error("Error loading news", e)
        return []
    }
}
