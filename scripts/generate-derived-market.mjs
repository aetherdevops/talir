/**
 * Precomputes derived market metrics from raw stock history + market_summary.
 * Output: lib/data/derived_market.json, lib/data/scrape_meta.json
 *
 * Equity filter: exclude index codes, government bonds (M*, RMDEN*).
 * 52-week signals additionally require a trade on asOfDate (volume or turnover > 0).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const stocksDir = path.join(__dirname, '../lib/data/stocks')
const summaryPath = path.join(__dirname, '../lib/data/market_summary.json')
const issuersPath = path.join(__dirname, '../lib/data/issuers.json')
const issuerMetaPath = path.join(__dirname, '../lib/data/issuer_meta.json')
const derivedPath = path.join(__dirname, '../lib/data/derived_market.json')
const metaPath = path.join(__dirname, '../lib/data/scrape_meta.json')

const CHANGE_ZERO_THRESHOLD = 0.005
const BREADTH_HISTORY_SESSIONS = 10
const TRADING_DAYS_52W = 252
const CONSISTENT_GAINER_STREAK = 5
const LEADERBOARD_LIMIT = 5

function classifyChangePercent(pct) {
    if (Math.abs(pct) < CHANGE_ZERO_THRESHOLD) return 'neutral'
    return pct > 0 ? 'up' : 'down'
}

function isExcludedCode(code) {
    if (code === 'MBI10' || code === 'OMB') return true
    if (/^M\d/.test(code) || code.startsWith('RMDEN')) return true
    return false
}

function tradedOnAsOf(item, asOfDate) {
    return item.date === asOfDate && (item.volume > 0 || item.turnover > 0)
}

function buildDailyCloses(history) {
    if (!history?.length) return []
    const uniqueMap = new Map()
    for (const item of history) {
        const key = new Date(item.date).toISOString().split('T')[0]
        uniqueMap.set(key, item.last_transaction_price)
    }
    return Array.from(uniqueMap.entries()).sort(([a], [b]) => a.localeCompare(b))
}

function computeChangeFromHistory(history) {
    const closes = buildDailyCloses(history)
    if (closes.length < 2) {
        return { change: 0, changePercent: 0, unchanged: true }
    }
    const latest = closes[closes.length - 1][1]
    const prev = closes[closes.length - 2][1]
    const change = latest - prev
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0
    return { change, changePercent, unchanged: classifyChangePercent(changePercent) === 'neutral' }
}

function getRecentDailyCloses(history, tradingDays = 30) {
    return buildDailyCloses(history).slice(-tradingDays).map(([date, value]) => ({ date, value }))
}

function loadSummary() {
    if (!fs.existsSync(summaryPath)) return []
    return JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
}

function loadSectorMap() {
    if (!fs.existsSync(issuersPath)) return new Map()
    const issuers = JSON.parse(fs.readFileSync(issuersPath, 'utf8'))
    const map = new Map()
    for (const issuer of issuers) {
        if (issuer.code && issuer.sector) map.set(issuer.code, issuer.sector)
    }
    return map
}

function loadIssuerMetaMap() {
    if (!fs.existsSync(issuerMetaPath)) return new Map()
    try {
        const file = JSON.parse(fs.readFileSync(issuerMetaPath, 'utf8'))
        const entries = file.issuers ?? file
        const map = new Map()
        for (const [code, entry] of Object.entries(entries)) {
            if (code === 'generatedAt' || code === 'count') continue
            if (entry && typeof entry === 'object' && entry.marketCapThousandsMkd > 0) {
                map.set(code, entry.marketCapThousandsMkd)
            }
        }
        return map
    } catch {
        return new Map()
    }
}

function loadStockCloses(code) {
    const stockPath = path.join(stocksDir, `${code}.json`)
    if (!fs.existsSync(stockPath)) return []
    try {
        const stock = JSON.parse(fs.readFileSync(stockPath, 'utf8'))
        return buildDailyCloses(stock.history)
    } catch {
        return []
    }
}

function changePercentAtIndex(closes, index) {
    if (index <= 0) return 0
    const prev = closes[index - 1][1]
    const curr = closes[index][1]
    if (prev === 0) return 0
    return ((curr - prev) / prev) * 100
}

function computeBreadthHistory(equityClosesMap, sessionDates) {
    return sessionDates.map((date) => {
        let advancers = 0
        let decliners = 0
        let unchanged = 0

        for (const closes of equityClosesMap.values()) {
            const index = closes.findIndex(([d]) => d === date)
            if (index <= 0) continue
            const pct = changePercentAtIndex(closes, index)
            const direction = classifyChangePercent(pct)
            if (direction === 'up') advancers++
            else if (direction === 'down') decliners++
            else unchanged++
        }

        return { date, advancers, decliners, unchanged }
    })
}

function computePctAbove30dAvg(equityClosesMap) {
    let above = 0
    let eligible = 0

    for (const closes of equityClosesMap.values()) {
        if (closes.length < 30) continue
        const window = closes.slice(-30)
        const latest = window[window.length - 1][1]
        const avg = window.reduce((sum, [, v]) => sum + v, 0) / window.length
        eligible++
        if (latest > avg) above++
    }

    return eligible > 0 ? (above / eligible) * 100 : 0
}

function compute52WeekSignals(code, closes, asOfDate) {
    const asOfIndex = closes.findIndex(([d]) => d === asOfDate)
    if (asOfIndex < 0) return null

    const windowStart = Math.max(0, asOfIndex - TRADING_DAYS_52W + 1)
    const window = closes.slice(windowStart, asOfIndex + 1)
    if (window.length === 0) return null

    const latestClose = window[window.length - 1][1]
    const highs = window.map(([, v]) => v)
    const maxClose = Math.max(...highs)
    const minClose = Math.min(...highs)

    return {
        isHigh: latestClose >= maxClose,
        isLow: latestClose <= minClose,
    }
}

function computeConsistentGainerStreak(closes, asOfDate) {
    const asOfIndex = closes.findIndex(([d]) => d === asOfDate)
    if (asOfIndex < CONSISTENT_GAINER_STREAK) return false

    for (let i = asOfIndex; i > asOfIndex - CONSISTENT_GAINER_STREAK; i--) {
        const pct = changePercentAtIndex(closes, i)
        if (classifyChangePercent(pct) !== 'up') return false
    }
    return true
}

const sectorMap = loadSectorMap()
const marketCapMap = loadIssuerMetaMap()
const summary = loadSummary()
const instruments = []
const equityClosesMap = new Map()
let asOfDate = ''

for (const item of summary) {
    const code = item.code
    let change = 0
    let changePercent = item.change_pct ?? 0
    let unchanged = changePercent === 0
    let price = item.price
    let date = item.date || ''

    const closes = loadStockCloses(code)
    if (closes.length > 0 && !isExcludedCode(code)) {
        equityClosesMap.set(code, closes)
    }
    if (closes.length > 0) {
        const computed = computeChangeFromHistory(
            closes.map(([d, v]) => ({ date: d, last_transaction_price: v }))
        )
        change = computed.change
        changePercent = computed.changePercent
        unchanged = computed.unchanged
        price = closes[closes.length - 1][1]
        date = closes[closes.length - 1][0]
    }

    if (date > asOfDate) asOfDate = date

    const sector = sectorMap.get(code) || null
    const marketCapThousandsMkd = marketCapMap.get(code)

    instruments.push({
        code,
        name: item.name || '',
        price,
        change,
        changePercent,
        volume: item.volume || 0,
        turnover: item.turnover || 0,
        date,
        unchanged,
        sector,
        ...(marketCapThousandsMkd != null ? { marketCapThousandsMkd } : {}),
    })
}

instruments.sort((a, b) => a.code.localeCompare(b.code))

if (!asOfDate) {
    asOfDate = new Date().toISOString().split('T')[0]
}

const equities = instruments.filter(
    (i) => !isExcludedCode(i.code) && (i.price > 0 || i.volume > 0)
)

let advancers = 0
let decliners = 0
let unchangedCount = 0
for (const s of equities) {
    const direction = classifyChangePercent(s.changePercent)
    if (direction === 'up') advancers++
    else if (direction === 'down') decliners++
    else unchangedCount++
}

const allSessionDates = new Set()
for (const closes of equityClosesMap.values()) {
    for (const [date] of closes) allSessionDates.add(date)
}
const sortedSessions = Array.from(allSessionDates).sort()
const breadthSessionDates = sortedSessions.slice(-BREADTH_HISTORY_SESSIONS)

const breadthHistory = computeBreadthHistory(equityClosesMap, breadthSessionDates)

// Align newest session with equity-filtered sentiment (same universe as the strip).
if (breadthHistory.length > 0) {
    const last = breadthHistory[breadthHistory.length - 1]
    if (last.date === asOfDate) {
        last.advancers = advancers
        last.decliners = decliners
        last.unchanged = unchangedCount
    }
}

const pctAbove30dAvg = computePctAbove30dAvg(equityClosesMap)

const weekHighs = []
const weekLows = []
const consistentGainers = []

for (const item of equities) {
    if (!tradedOnAsOf(item, asOfDate)) continue
    const closes = equityClosesMap.get(item.code)
    if (!closes?.length) continue

    const signals = compute52WeekSignals(item.code, closes, asOfDate)
    if (signals?.isHigh) weekHighs.push(item.code)
    if (signals?.isLow) weekLows.push(item.code)
    if (computeConsistentGainerStreak(closes, asOfDate)) consistentGainers.push(item.code)
}

weekHighs.sort()
weekLows.sort()
consistentGainers.sort()

const newHighs52w = weekHighs.length
const newLows52w = weekLows.length

const sectorBuckets = new Map()
for (const item of equities) {
    const sector = item.sector || sectorMap.get(item.code)
    if (!sector) continue

    if (!sectorBuckets.has(sector)) {
        sectorBuckets.set(sector, {
            name: sector,
            advancers: 0,
            decliners: 0,
            unchanged: 0,
            count: 0,
            changeSum: 0,
        })
    }

    const bucket = sectorBuckets.get(sector)
    bucket.count++
    bucket.changeSum += item.changePercent
    const direction = classifyChangePercent(item.changePercent)
    if (direction === 'up') bucket.advancers++
    else if (direction === 'down') bucket.decliners++
    else bucket.unchanged++
}

const sectors = Array.from(sectorBuckets.values())
    .map((bucket) => ({
        name: bucket.name,
        avgChangePct: bucket.count > 0 ? bucket.changeSum / bucket.count : 0,
        advancers: bucket.advancers,
        decliners: bucket.decliners,
        unchanged: bucket.unchanged,
        count: bucket.count,
    }))
    .sort((a, b) => a.name.localeCompare(b.name))

const byChangeDesc = [...equities].sort((a, b) => b.changePercent - a.changePercent)
const byChangeAsc = [...equities].sort((a, b) => a.changePercent - b.changePercent)
const byTurnover = [...equities].sort((a, b) => b.turnover - a.turnover)

const topGainers = byChangeDesc.slice(0, LEADERBOARD_LIMIT).map((s) => s.code)
const topLosers = byChangeAsc.slice(0, LEADERBOARD_LIMIT).map((s) => s.code)
const mostActive = byTurnover.slice(0, LEADERBOARD_LIMIT).map((s) => s.code)

const derived = {
    asOfDate,
    instruments,
    sentiment: { advancers, decliners, unchanged: unchangedCount },
    topGainers,
    topLosers,
    mostActive,
    breadth: {
        history: breadthHistory,
        pctAbove30dAvg: Math.round(pctAbove30dAvg * 10) / 10,
        newHighs52w,
        newLows52w,
        high52wCodes: weekHighs,
        low52wCodes: weekLows,
    },
    leaderboards: {
        weekHighs: weekHighs.slice(0, LEADERBOARD_LIMIT),
        weekLows: weekLows.slice(0, LEADERBOARD_LIMIT),
        consistentGainers: consistentGainers.slice(0, LEADERBOARD_LIMIT),
    },
    sectors,
}

fs.writeFileSync(derivedPath, JSON.stringify(derived))
fs.writeFileSync(
    metaPath,
    JSON.stringify({
        asOfDate: derived.asOfDate,
        status: 'ok',
        generatedAt: new Date().toISOString(),
        instrumentCount: instruments.length,
    })
)

console.log(`Wrote derived market (${instruments.length} instruments, as of ${derived.asOfDate})`)
console.log(
    `  breadth: ${breadthHistory.length} sessions, pctAbove30dAvg ${derived.breadth.pctAbove30dAvg}%, 52w H/L ${newHighs52w}/${newLows52w}, sectors ${sectors.length}`
)
