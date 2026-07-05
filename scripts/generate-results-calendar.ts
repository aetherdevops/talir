/**
 * Prebuild: results calendar from news_feed.json
 * Output: lib/data/derived_results_calendar.json
 */
import fs from 'fs'
import path from 'path'
import { buildResultsCalendarFile } from '../lib/results-calendar'
import type { NewsFeedFile } from '../lib/types'

const dataDir = path.join(process.cwd(), 'lib', 'data')
const feedPath = path.join(dataDir, 'news_feed.json')
const issuersPath = path.join(dataDir, 'issuers.json')
const outPath = path.join(dataDir, 'derived_results_calendar.json')

if (!fs.existsSync(feedPath)) {
    console.error(`Missing ${feedPath}. Run npm run generate:news-feed first.`)
    process.exit(1)
}

const feed = JSON.parse(fs.readFileSync(feedPath, 'utf8')) as NewsFeedFile
const issuerCount = fs.existsSync(issuersPath)
    ? (JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as unknown[]).length
    : 0

const payload = buildResultsCalendarFile(feed.items, {
    lastIssuerScan: feed.lastIssuerScan ?? null,
    issuerCount,
})

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
console.log(
    `Wrote results calendar: ${payload.recent.length} recent, ${payload.all.length} total, ${payload.expected.length} expected → ${outPath}`
)
