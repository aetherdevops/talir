/**
 * Prebuild: unified filings feed from issuer SECNet links.
 * Output: lib/data/news_feed.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const issuersPath = path.join(__dirname, '../lib/data/issuers.json')
const outPath = path.join(__dirname, '../lib/data/news_feed.json')
const metaPath = path.join(__dirname, '../lib/data/scrape_meta.json')

function normalizeNewsUrl(url) {
    if (!url?.trim()) return null
    const trimmed = url.trim()
    if (trimmed === '#' || trimmed.startsWith('javascript:')) return null
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
    if (trimmed.startsWith('//')) return `https:${trimmed}`
    return `https://${trimmed}`
}

function parseReportDate(title, dateStr) {
    const fromField = normalizeIsoDate(dateStr)
    if (fromField) return fromField

    const match = title.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (match) {
        return formatIso(Number(match[3]), Number(match[1]), Number(match[2]))
    }

    return null
}

function normalizeIsoDate(value) {
    if (!value?.trim()) return null
    const trimmed = value.trim()

    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed

    const us = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
    if (us) return formatIso(Number(us[3]), Number(us[1]), Number(us[2]))

    const eu = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
    if (eu) return formatIso(Number(eu[3]), Number(eu[2]), Number(eu[1]))

    return null
}

function formatIso(year, month, day) {
    if (month < 1 || month > 12 || day < 1 || day > 31) return null
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function categorizeReport(rawTitle) {
    const lower = rawTitle.toLowerCase()
    if (lower.includes('dividend')) return 'dividend'
    if (lower.includes('profit') || lower.includes('loss') || lower.includes('p&l')) return 'earnings'
    if (lower.includes('financial statement') || lower.includes('balance sheet') || lower.includes('audited')) {
        return 'financials'
    }
    if (lower.includes('annual report') || lower.includes('corporate') || lower.includes('governance')) {
        return 'corporate'
    }
    return 'other'
}

function stripReportPrefix(rawTitle) {
    return rawTitle
        .replace(/^\d{1,2}\/\d{1,2}\/\d{4}\s*-\s*/i, '')
        .replace(/^[^-]+-\s*/, '')
        .trim()
}

function parseReportTitle(rawTitle, stockCode) {
    const body = stripReportPrefix(rawTitle)
    const lower = body.toLowerCase()
    const code = stockCode

    if (lower.includes('dividend')) return `${code} files dividend disclosure`

    if (lower.includes('profit') || lower.includes('loss') || lower.includes('p&l')) {
        const period = body.match(/(\d{2}\.\d{2}\.\s*[-–]\s*\d{2}\.\d{2}\.?)/)?.[1]
        const normalizedPeriod = period ? period.replace(/\s*-\s*/g, '–').replace(/\.\s*$/, '').trim() : null

        if (lower.includes('loss') && !lower.includes('profit')) {
            return normalizedPeriod
                ? `${code} reports loss for ${normalizedPeriod}`
                : `${code} reports loss in profit and loss filing`
        }

        return normalizedPeriod
            ? `${code} reports profit and loss for ${normalizedPeriod}`
            : `${code} files profit and loss report`
    }

    if (lower.includes('audited financial')) return `${code} files audited financial statements`
    if (lower.includes('financial statement') || lower.includes('non-audited')) {
        return `${code} files interim financial statements`
    }
    if (lower.includes('annual report')) return `${code} files annual report`
    if (lower.includes('corporate governance') || lower.includes('governance')) {
        return `${code} files corporate governance disclosure`
    }

    const short = body.length > 72 ? `${body.slice(0, 71)}…` : body
    return `${code}: ${short}`
}

function buildFeed(issuers) {
    const seenUrls = new Set()
    const items = []
    const undatedByCode = {}

    for (const issuer of issuers) {
        if (!issuer.reportLinks?.length) continue

        for (const report of issuer.reportLinks) {
            const url = normalizeNewsUrl(report.url)
            if (!url) continue

            const dedupeKey = url.toLowerCase()
            if (seenUrls.has(dedupeKey)) continue
            seenUrls.add(dedupeKey)

            const rawTitle = report.title
            const isoDate = parseReportDate(rawTitle, report.date)
            const item = {
                id: `${issuer.code}-${dedupeKey.replace(/[^a-z0-9]+/gi, '-').slice(0, 48)}`,
                rawTitle,
                title: parseReportTitle(rawTitle, issuer.code),
                source: 'SECNet',
                stockCode: issuer.code,
                stockName: issuer.name,
                category: categorizeReport(rawTitle),
                publishedAt: isoDate,
                dateKnown: isoDate !== null,
                url,
            }

            if (isoDate) {
                items.push(item)
            } else {
                if (!undatedByCode[issuer.code]) undatedByCode[issuer.code] = []
                undatedByCode[issuer.code].push(item)
            }
        }
    }

    items.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
    for (const code of Object.keys(undatedByCode)) {
        undatedByCode[code].sort((a, b) => a.title.localeCompare(b.title))
    }

    return { items, undatedByCode }
}

if (!fs.existsSync(issuersPath)) {
    console.error(`Missing ${issuersPath}. Run npm run script:issuers first.`)
    process.exit(1)
}

const issuers = JSON.parse(fs.readFileSync(issuersPath, 'utf8'))
const { items, undatedByCode } = buildFeed(issuers)

const issuerStat = fs.statSync(issuersPath)
const lastIssuerScan = issuerStat.mtime.toISOString().split('T')[0]

const undatedCount = Object.values(undatedByCode).reduce((sum, list) => sum + list.length, 0)

const payload = {
    generatedAt: new Date().toISOString(),
    lastIssuerScan,
    count: items.length + undatedCount,
    datedCount: items.length,
    undatedCount,
    items,
    undatedByCode,
}

fs.writeFileSync(outPath, JSON.stringify(payload, null, 2))
console.log(`Wrote news feed: ${items.length} dated, ${undatedCount} undated → ${outPath}`)

if (fs.existsSync(metaPath)) {
    const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'))
    meta.lastIssuerScan = lastIssuerScan
    fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2))
}
