/**
 * Scrape MBI10 index constituents from MSE composition page.
 * Output: lib/data/mbi10_constituents.json
 */
import fs from 'fs'
import path from 'path'
import * as cheerio from 'cheerio'
import { MBI10_FALLBACK_CODES } from '../lib/index-constituents'

const MSE_URL = 'https://www.mse.mk/en/content/13/3/2010/structure-of-index-mbi10'
const outPath = path.join(process.cwd(), 'lib', 'data', 'mbi10_constituents.json')

/** Tickers that appear in the MSE composition table (Symbol column). */
const KNOWN_MSE_TICKERS = new Set([
    ...MBI10_FALLBACK_CODES,
    'EVRO',
    'OHRM',
    'FERS',
    'SBT',
])

function extractCodesFromHtml(html: string): string[] {
    const $ = cheerio.load(html)
    const codes = new Set<string>()

    $('table tr').each((_, row) => {
        const cells = $(row)
            .find('td')
            .map((__, cell) => $(cell).text().trim())
            .get()
        for (const cell of cells) {
            const upper = cell.toUpperCase()
            if (/^[A-Z]{2,5}$/.test(upper) && KNOWN_MSE_TICKERS.has(upper)) {
                codes.add(upper)
            }
        }
    })

    // Plain-text fallback: lines that are only a ticker
    const text = $.text()
    for (const line of text.split(/\n+/)) {
        const trimmed = line.trim().toUpperCase()
        if (/^[A-Z]{2,5}$/.test(trimmed) && KNOWN_MSE_TICKERS.has(trimmed)) {
            codes.add(trimmed)
        }
    }

    return Array.from(codes)
}

async function main(): Promise<void> {
    let codes: string[] = []
    let source = 'mse-scrape'

    try {
        const res = await fetch(MSE_URL, {
            headers: { 'User-Agent': 'Talir/1.0 (mbi10-constituents)' },
        })
        if (res.ok) {
            const html = await res.text()
            codes = extractCodesFromHtml(html)
        }
    } catch (err) {
        console.warn('MBI10 scrape failed:', err)
    }

    if (codes.length < 8) {
        console.warn(`MBI10 scrape found only ${codes.length} codes — using fallback list`)
        codes = [...MBI10_FALLBACK_CODES]
        source = 'fallback'
    }

    codes.sort()

    const payload = {
        asOfDate: new Date().toISOString().split('T')[0],
        codes,
        source,
    }

    fs.mkdirSync(path.dirname(outPath), { recursive: true })
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
    console.log(`Wrote MBI10 constituents (${codes.length}): ${codes.join(', ')} → ${outPath}`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
