/**
 * Prebuild: annual P&L / audited FY fundamentals from issuer SECNet links.
 * Output: lib/data/derived_fundamentals.json
 *
 * Set TALIR_PARSE_FUNDAMENTALS=1 to fetch attachments and parse EPS / net profit.
 */
import fs from 'fs'
import path from 'path'
import { parseReportDate } from '../lib/news-dates'
import {
    buildFundamentalsFile,
    inferFiscalYearFromTitle,
    isAnnualFundamentalTitle,
    parseFundamentalText,
    type FundamentalEntry,
} from '../lib/fundamentals'
import { fetchDividendDocumentText } from '../lib/seinet-document'

const dataDir = path.join(process.cwd(), 'lib', 'data')
const issuersPath = path.join(dataDir, 'issuers.json')
const outPath = path.join(dataDir, 'derived_fundamentals.json')

interface ReportLink {
    title: string
    url: string
    date?: string
}

interface IssuerRow {
    code: string
    name: string
    reportLinks?: ReportLink[]
}

function normalizeUrl(url: string | undefined): string | null {
    if (!url?.trim()) return null
    const trimmed = url.trim()
    if (trimmed.startsWith('http')) return trimmed
    return `https://${trimmed}`
}

function collectFromIssuers(issuers: IssuerRow[]): FundamentalEntry[] {
    const byKey = new Map<string, FundamentalEntry>()

    for (const issuer of issuers) {
        for (const link of issuer.reportLinks ?? []) {
            if (!isAnnualFundamentalTitle(link.title)) continue
            const url = normalizeUrl(link.url)
            const filedAt = parseReportDate(link.title, link.date)
            const fiscalYear = filedAt ? inferFiscalYearFromTitle(link.title, filedAt) : null
            if (!url || !filedAt || !fiscalYear) continue

            const key = `${issuer.code}:${fiscalYear}`
            const existing = byKey.get(key)
            if (existing && existing.filedAt >= filedAt) continue

            byKey.set(key, {
                stockCode: issuer.code,
                stockName: issuer.name,
                fiscalYear,
                filedAt,
                url,
                netProfit: null,
                eps: null,
                parseStatus: 'link_only',
                source: 'SECNet',
            })
        }
    }

    return Array.from(byKey.values())
}

async function enrichWithDocumentParse(entries: FundamentalEntry[]): Promise<void> {
    if (process.env.TALIR_PARSE_FUNDAMENTALS !== '1') return

    let parsed = 0
    let partial = 0
    let linkOnly = 0

    for (const entry of entries) {
        const result = await fetchDividendDocumentText(entry.url)
        if (!result) {
            linkOnly++
            continue
        }

        const fields = parseFundamentalText(result.text)
        Object.assign(entry, fields)

        if (fields.parseStatus === 'parsed') parsed++
        else if (fields.parseStatus === 'partial') partial++
        else linkOnly++
    }

    console.log(
        `Fundamentals parse: ${parsed} parsed, ${partial} partial, ${linkOnly} link_only (of ${entries.length})`
    )
}

async function main(): Promise<void> {
    if (!fs.existsSync(issuersPath)) {
        console.error(`Missing ${issuersPath}. Run npm run script:issuers first.`)
        process.exit(1)
    }

    const issuers = JSON.parse(fs.readFileSync(issuersPath, 'utf8')) as IssuerRow[]
    const entries = collectFromIssuers(issuers)

    await enrichWithDocumentParse(entries)

    const payload = buildFundamentalsFile(entries)
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
    console.log(
        `Wrote fundamentals: ${payload.all.length} annual filings, ${Object.keys(payload.byIssuer).length} issuers → ${outPath}`
    )
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
