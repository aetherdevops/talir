/** Pure types for derived market data — safe for client components (no JSON/server imports). */

export type BreadthHistoryPoint = {
    date: string
    advancers: number
    decliners: number
    unchanged: number
}

export type DerivedBreadth = {
    history: BreadthHistoryPoint[]
    pctAbove30dAvg: number
    newHighs52w: number
    newLows52w: number
    high52wCodes?: string[]
    low52wCodes?: string[]
}

export type DerivedSectorRollup = {
    name: string
    avgChangePct: number
    advancers: number
    decliners: number
    unchanged: number
    count: number
}

export interface MarketSentiment {
    advancers: number
    decliners: number
    unchanged: number
    primaryIndex?: { name: string; value: number; changePercent: number }
}

export type SearchIndexItem = {
    code: string
    name: string
    type: 'Stock' | 'Index'
    q: string
}

export type SparklineMap = Record<string, { date: string; value: number }[]>
