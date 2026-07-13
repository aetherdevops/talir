/**
 * Scrape Fin.Ratios (DPS / EPS / dividend yield) from mse.mk/en/symbol/{code}.
 * Output: lib/data/mse_symbol_ratios.json
 *
 * TALIR_SCOPE=MBI10 (default) or ALL
 */
import fs from 'fs'
import path from 'path'
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()
import { getMbi10Codes, resolveIngestScope } from '../lib/index-constituents'
import {
    parseMseSymbolRatiosHtml,
    type MseSymbolRatiosFile,
    type MseSymbolRatiosIssuer,
} from '../lib/mse-symbol-ratios'

const BASE_URL = 'https://www.mse.mk'
const DATA_DIR = path.join(process.cwd(), 'lib', 'data')
const OUT_PATH = path.join(DATA_DIR, 'mse_symbol_ratios.json')

function isExcludedEquityCode(code: string): boolean {
    if (code === 'MBI10' || code === 'OMB') return true
    if (/^M\d/.test(code) || code.startsWith('RMDEN')) return true
    return false
}

function resolveCodes(): string[] {
    const scope = resolveIngestScope()
    if (scope === 'MBI10') return getMbi10Codes().map((c) => c.toUpperCase())

    const summaryPath = path.join(DATA_DIR, 'market_summary.json')
    if (!fs.existsSync(summaryPath)) {
        console.warn('Missing market_summary.json — falling back to MBI10')
        return getMbi10Codes().map((c) => c.toUpperCase())
    }
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8')) as Array<{ code: string }>
    return summary
        .map((row) => row.code?.toUpperCase())
        .filter((code): code is string => Boolean(code) && !isExcludedEquityCode(code))
}

async function fetchHtml(url: string): Promise<string | null> {
    try {
        const response = await fetch(url, {
            headers: { 'User-Agent': 'TalirMSEBot/1.0 (+https://talir.mk)' },
        })
        if (!response.ok) throw new Error(`Status ${response.status}`)
        return await response.text()
    } catch (err) {
        console.error(`Error fetching ${url}:`, err)
        return null
    }
}

async function main(): Promise<void> {
    const codes = resolveCodes()
    console.log(`MSE symbol ratios — scope codes: ${codes.length}`)

    const byCode: Record<string, MseSymbolRatiosIssuer> = {}
    const CHUNK = 5

    for (let i = 0; i < codes.length; i += CHUNK) {
        const chunk = codes.slice(i, i + CHUNK)
        await Promise.all(
            chunk.map(async (code) => {
                const url = `${BASE_URL}/en/symbol/${encodeURIComponent(code)}`
                const html = await fetchHtml(url)
                if (!html) return
                const years = parseMseSymbolRatiosHtml(html)
                if (Object.keys(years).length === 0) {
                    console.warn(`  ${code}: no Fin.Ratios DPS/EPS rows`)
                    return
                }
                byCode[code] = { years }
                const dpsYears = Object.entries(years)
                    .filter(([, y]) => y.dps !== null)
                    .map(([y]) => y)
                console.log(`  ${code}: DPS years ${dpsYears.join(', ') || '—'}`)
            })
        )
        await new Promise((r) => setTimeout(r, 400))
    }

    const payload: MseSymbolRatiosFile = {
        generatedAt: new Date().toISOString(),
        byCode,
    }

    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2))
    console.log(
        `Wrote ${Object.keys(byCode).length} issuers → ${OUT_PATH}`
    )
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
