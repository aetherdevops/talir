/**
 * Scans the scraped MSE history for stock splits that are not yet in
 * lib/data/corporate_actions.json.
 *
 * MSE never announces a split through the price feed, so an unrecorded split silently
 * corrupts every chart and multi-day return that spans it. This runs in the daily job
 * (before the derived assets are rebuilt) so a new split is caught the morning it happens.
 *
 *   npm run detect:splits                    MBI10, last 180 days
 *   npm run detect:splits -- --write         also append confirmed events to the registry
 *   npm run detect:splits -- --audit --all   every ticker, all history (noisy by design)
 *   npm run detect:splits -- --code REPL,KMB --since 2002-01-01
 *
 * Exit codes: 0 nothing new, 1 a new event needs attention, 2 the scan itself failed.
 */
import fs from 'fs'
import path from 'path'

import {
    candidateToSplit,
    detectSplitCandidates,
    formatRatio,
    getAllStockSplits,
    type SplitCandidate,
    type StockSplit,
} from '../lib/corporate-actions'
import { getMbi10Codes } from '../lib/index-constituents'
import type { DailyPrice } from '../lib/types'

const stocksDir = path.join(process.cwd(), 'lib', 'data', 'stocks')
const registryPath = path.join(process.cwd(), 'lib', 'data', 'corporate_actions.json')

/** Long enough that a split cannot slip through a holiday or a failed run. */
const DEFAULT_WINDOW_DAYS = 180

const args = process.argv.slice(2)
const shouldWrite = args.includes('--write')
const scanAll = args.includes('--all')
const isAudit = args.includes('--audit')
const isCi = Boolean(process.env.GITHUB_ACTIONS)

function argValue(flag: string): string | null {
    const index = args.indexOf(flag)
    if (index === -1 || index === args.length - 1) return null
    return args[index + 1]
}

function resolveSince(): string {
    const explicit = argValue('--since')
    if (explicit) return explicit
    if (isAudit) return ''

    const cutoff = new Date()
    cutoff.setDate(cutoff.getDate() - DEFAULT_WINDOW_DAYS)
    return cutoff.toISOString().split('T')[0]
}

function resolveCodes(): string[] {
    const explicit = argValue('--code')
    if (explicit) return explicit.split(',').map((c) => c.trim().toUpperCase()).filter(Boolean)

    const available = fs
        .readdirSync(stocksDir)
        .filter((f) => f.endsWith('.json'))
        .map((f) => f.replace(/\.json$/, ''))

    if (scanAll) return available.sort()

    // Default scope mirrors the ingest jobs: the index we actually publish analytics for.
    const mbi10 = new Set(getMbi10Codes())
    return available.filter((code) => mbi10.has(code)).sort()
}

function loadHistory(code: string): DailyPrice[] {
    const filePath = path.join(stocksDir, `${code}.json`)
    if (!fs.existsSync(filePath)) return []
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { history?: DailyPrice[] }
        return Array.isArray(raw.history) ? raw.history : []
    } catch {
        return []
    }
}

function describe(candidate: SplitCandidate): string {
    const lines = [
        `  ${candidate.code}  ${candidate.effectiveDate}  ${formatRatio(candidate.ratio)}  [${candidate.confidence}]`,
        `    ${candidate.previousDate} close ${candidate.previousClose} → ${candidate.effectiveDate} close ${candidate.close} ` +
            `(MSE printed ${candidate.msePercentChange}%)`,
    ]
    for (const item of candidate.evidence) lines.push(`    · ${item}`)
    return lines.join('\n')
}

function appendToRegistry(splits: StockSplit[]): void {
    const file = JSON.parse(fs.readFileSync(registryPath, 'utf8')) as {
        version: number
        updatedAt: string
        splits: StockSplit[]
    }

    file.splits = [...file.splits, ...splits].sort(
        (a, b) => a.effectiveDate.localeCompare(b.effectiveDate) || a.code.localeCompare(b.code)
    )
    file.updatedAt = new Date().toISOString().split('T')[0]

    fs.writeFileSync(registryPath, `${JSON.stringify(file, null, 2)}\n`)
}

function main(): number {
    if (!fs.existsSync(stocksDir)) {
        console.error(`Stocks directory not found: ${stocksDir}`)
        return 2
    }

    const codes = resolveCodes()
    const knownSplits = getAllStockSplits()
    const since = resolveSince()

    const confirmed: SplitCandidate[] = []
    const review: SplitCandidate[] = []

    for (const code of codes) {
        const history = loadHistory(code)
        if (!history.length) continue

        for (const candidate of detectSplitCandidates(code, history, { knownSplits, since })) {
            if (candidate.confidence === 'confirmed') confirmed.push(candidate)
            else review.push(candidate)
        }
    }

    console.log(
        `Scanned ${codes.length} ticker${codes.length === 1 ? '' : 's'} ` +
            `${since ? `since ${since}` : 'over all history'} ` +
            `against ${knownSplits.length} recorded split${knownSplits.length === 1 ? '' : 's'}.`
    )

    if (!confirmed.length && !review.length) {
        console.log('No unrecorded splits found.')
        return 0
    }

    if (confirmed.length) {
        console.log(`\nConfirmed — MSE rebased its own reference price (${confirmed.length}):`)
        for (const candidate of confirmed) console.log(describe(candidate))
    }

    if (review.length) {
        console.log(`\nNeeds review — unexplained price gap (${review.length}):`)
        for (const candidate of review) console.log(describe(candidate))
        console.log(
            '\n  Confirm each against the issuer filing before adding it to lib/data/corporate_actions.json.\n' +
                '  Thinly traded MSE tickers can gap like this without any corporate action.'
        )
    }

    if (shouldWrite && confirmed.length) {
        appendToRegistry(confirmed.map((c) => candidateToSplit(c, 'detected:mse-reference-rebase')))
        console.log(
            `\nAdded ${confirmed.length} confirmed split(s) to lib/data/corporate_actions.json. ` +
                'Rerun the derived generators to rebase the published data.'
        )
    } else if (confirmed.length) {
        console.log('\nRerun with --write to add the confirmed events to the registry.')
    }

    if (isCi) {
        for (const candidate of [...confirmed, ...review]) {
            console.log(
                `::warning::Unrecorded ${candidate.confidence} stock split — ` +
                    `${candidate.code} ${formatRatio(candidate.ratio)} effective ${candidate.effectiveDate}`
            )
        }
    }

    return 1
}

process.exit(main())
