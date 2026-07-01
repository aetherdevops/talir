/**
 * Precomputes derived market metrics from raw stock history + market_summary.
 * Output: lib/data/derived_market.json, lib/data/scrape_meta.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const stocksDir = path.join(__dirname, '../lib/data/stocks')
const summaryPath = path.join(__dirname, '../lib/data/market_summary.json')
const indicesDir = path.join(__dirname, '../lib/data/indices')
const derivedPath = path.join(__dirname, '../lib/data/derived_market.json')
const metaPath = path.join(__dirname, '../lib/data/scrape_meta.json')

function getRecentDailyCloses(history, tradingDays = 30) {
    if (!history?.length) return []
    const uniqueMap = new Map()
    for (const item of history) {
        const d = new Date(item.date)
        const key = d.toISOString().split('T')[0]
        uniqueMap.set(key, item.last_transaction_price)
    }
    return Array.from(uniqueMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-tradingDays)
        .map(([date, value]) => ({ date, value }))
}

function computeChangeFromHistory(history) {
    if (!history?.length) return { change: 0, changePercent: 0, unchanged: true }

    const uniqueMap = new Map()
    for (const item of history) {
        const d = new Date(item.date)
        const key = d.toISOString().split('T')[0]
        uniqueMap.set(key, item.last_transaction_price)
    }
    const closes = Array.from(uniqueMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([, v]) => v)

    if (closes.length < 2) {
        return { change: 0, changePercent: 0, unchanged: true }
    }

    const latest = closes[closes.length - 1]
    const prev = closes[closes.length - 2]
    const change = latest - prev
    const changePercent = prev !== 0 ? (change / prev) * 100 : 0
    return { change, changePercent, unchanged: changePercent === 0 }
}

function loadSummary() {
    if (!fs.existsSync(summaryPath)) return []
    return JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
}

const summary = loadSummary()
const instruments = []
let asOfDate = ''

for (const item of summary) {
    const code = item.code
    let change = 0
    let changePercent = item.change_pct ?? 0
    let unchanged = changePercent === 0
  let price = item.price
    let date = item.date || ''

    const stockPath = path.join(stocksDir, `${code}.json`)
    if (fs.existsSync(stockPath)) {
        try {
            const stock = JSON.parse(fs.readFileSync(stockPath, 'utf8'))
            const computed = computeChangeFromHistory(stock.history)
            change = computed.change
            changePercent = computed.changePercent
            unchanged = computed.unchanged
            const closes = getRecentDailyCloses(stock.history, 2)
            if (closes.length > 0) {
                price = closes[closes.length - 1].value
            }
            if (stock.history?.length) {
                const last = stock.history[stock.history.length - 1]
                date = new Date(last.date).toISOString().split('T')[0]
            }
        } catch {
            /* keep summary values */
            changePercent = item.change_pct ?? 0
        }
    }

    if (date > asOfDate) asOfDate = date

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
    })
}

instruments.sort((a, b) => a.code.localeCompare(b.code))

const equities = instruments.filter((i) => i.price > 0 || i.volume > 0)
let advancers = 0
let decliners = 0
let unchangedCount = 0
for (const s of equities) {
    if (s.changePercent > 0) advancers++
    else if (s.changePercent < 0) decliners++
    else unchangedCount++
}

const byChangeDesc = [...equities].sort((a, b) => b.changePercent - a.changePercent)
const byChangeAsc = [...equities].sort((a, b) => a.changePercent - b.changePercent)
const byTurnover = [...equities].sort((a, b) => b.turnover - a.turnover)

const derived = {
    asOfDate: asOfDate || new Date().toISOString().split('T')[0],
    instruments,
    sentiment: { advancers, decliners, unchanged: unchangedCount },
    topGainers: byChangeDesc.slice(0, 5).map((s) => s.code),
    topLosers: byChangeAsc.slice(0, 5).map((s) => s.code),
    mostActive: byTurnover.slice(0, 5).map((s) => s.code),
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
