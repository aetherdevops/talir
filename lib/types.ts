export interface DailyPrice {
    date: string
    last_transaction_price: number
    max_price: number | null
    min_price: number | null
    average_price: number
    percent_change: number
    quantity: number
    turnover_best_mkd: number
    total_turnover_mkd: number
}

// Flexible interface for Issuer Data since keys can be dynamic/variable
export interface IssuerData {
    company_name: string
    address?: string
    city?: string
    phone?: string
    fax?: string
    email?: string
    website?: string
    contact_person?: string
    [key: string]: string | undefined
}

export interface StockData {
    company_code: string
    company_name: string // Latin
    company_name_original?: string // Cyrillic (stored but usually hidden)
    sector?: string
    history: DailyPrice[]
    first_trade_date: string
    issuer_data?: IssuerData
}

export interface StockSummary {
    code: string
    name: string
    price: number
    change: number     // Absolute change? OR is it change_pct? 
    // Market summary has `change_pct`
    changePercent: number
    volume: number
    turnover: number
    date: string
    type?: 'Stock' | 'Index'
    chartSeries?: { date: string; value: number }[]
}

export interface MarketIndex {
    name: string
    value: number
    change: number
    changePercent: number
    chartData?: number[]
    chartSeries?: { date: string; value: number }[]
}

export type NewsCategory = 'earnings' | 'financials' | 'dividend' | 'corporate' | 'other'

/** Objective filing severity for indicator dots — not market sentiment. */
export type FilingIndicatorTier = 'material' | 'dividend' | 'routine'

export interface NewsItem {
    id: string
    title: string
    rawTitle?: string
    source: string
    publishedAt: string | null
    dateKnown: boolean
    stockCode: string
    stockName?: string
    category: NewsCategory
    /** Precomputed at feed build; falls back to runtime tier helper when absent. */
    filingTier?: FilingIndicatorTier
    imageUrl?: string
    url: string
}

export interface NewsFeedFile {
    generatedAt: string
    lastIssuerScan: string | null
    count: number
    datedCount: number
    undatedCount: number
    items: NewsItem[]
    undatedByCode: Record<string, NewsItem[]>
}
