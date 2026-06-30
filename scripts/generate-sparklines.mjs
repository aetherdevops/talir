/**
 * Precomputes last-30-day sparklines into lib/data/sparklines.json.
 * Keeps serverless bundles small (avoids importing every stock JSON at runtime).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const stocksDir = path.join(__dirname, '../lib/data/stocks')
const outPath = path.join(__dirname, '../lib/data/sparklines.json')

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

if (!fs.existsSync(stocksDir)) {
    console.error('Stocks directory not found:', stocksDir)
    process.exit(1)
}

const files = fs.readdirSync(stocksDir).filter((f) => f.endsWith('.json'))
const result = {}

for (const file of files) {
    const code = file.replace(/\.json$/, '')
    try {
        const raw = fs.readFileSync(path.join(stocksDir, file), 'utf8')
        const data = JSON.parse(raw)
        result[code] = getRecentDailyCloses(data.history, 30)
    } catch (err) {
        console.warn(`Skipping ${code}:`, err.message)
        result[code] = []
    }
}

fs.writeFileSync(outPath, JSON.stringify(result))
console.log(`Wrote sparklines for ${files.length} stocks → ${outPath}`)
