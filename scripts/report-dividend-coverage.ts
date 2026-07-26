/**
 * Report dividend coverage matrix (issuer × profitYear).
 * Writes lib/data/derived_dividend_coverage.json and prints a console summary.
 *
 * Optional: TALIR_DOCUMENT_STORE=supabase to include Supabase overrides / docs.
 */
import fs from 'fs'
import path from 'path'
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()

import {
    formatCoverageConsole,
    generateDividendCoverageReport,
    writeCoverageReport,
} from '../lib/dividend-coverage'
import { defaultDataPaths } from '../lib/dividend-discovery'

const MSE_RATIOS_MAX_AGE_DAYS = 14

function mseRatiosAgeDays(dataDir: string): number | null {
    const filePath = path.join(dataDir, 'mse_symbol_ratios.json')
    if (!fs.existsSync(filePath)) return null
    try {
        const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { generatedAt?: string }
        if (!raw.generatedAt) return null
        const ageMs = Date.now() - new Date(raw.generatedAt).getTime()
        return ageMs / (1000 * 60 * 60 * 24)
    } catch {
        return null
    }
}

async function main(): Promise<void> {
    const { dataDir } = defaultDataPaths()
    const report = await generateDividendCoverageReport(dataDir)
    const outPath = writeCoverageReport(report, dataDir)
    console.log(formatCoverageConsole(report))
    console.log(`Wrote ${outPath}`)

    const s = report.summary
    const quality = s.parsed + s.partial
    const qualityShare = s.totalCells > 0 ? quality / s.totalCells : 0
    console.log(
        `Coverage quality (parsed+partial): ${(qualityShare * 100).toFixed(1)}% (${quality}/${s.totalCells})`
    )

    const withExShare = s.totalCells > 0 ? s.withEx / s.totalCells : 0
    const withPaymentShare = s.totalCells > 0 ? s.withPayment / s.totalCells : 0

    if (s.totalCells > 0 && s.withGross / s.totalCells >= 0.5 && withExShare < 0.6) {
        console.log(
            `::warning:: Dividend analytics core low: withEx ${(withExShare * 100).toFixed(1)}% (${s.withEx}/${s.totalCells}) — need ≥60%`
        )
    } else if (s.totalCells > 0 && s.withGross / s.totalCells < 0.6) {
        console.log(
            `::warning:: Dividend analytics core low: withGross ${((s.withGross / s.totalCells) * 100).toFixed(1)}% (${s.withGross}/${s.totalCells}) — need ≥60%`
        )
    }

    const analyticsOk =
        s.totalCells > 0 && s.withGross / s.totalCells >= 0.6 && s.withEx / s.totalCells >= 0.6
    if (!analyticsOk && s.totalCells > 0) {
        console.log(
            `::warning:: Dividend analytics core (gross+ex) below target: gross=${s.withGross} ex=${s.withEx} / ${s.totalCells}`
        )
    }

    if (s.totalCells > 0 && withPaymentShare < 0.4) {
        console.log(
            `::warning:: Dividend payment dates low: ${(withPaymentShare * 100).toFixed(1)}% (${s.withPayment}/${s.totalCells}) — need ≥40%`
        )
    }

    const age = mseRatiosAgeDays(dataDir)
    if (age === null) {
        console.log('::warning:: mse_symbol_ratios.json missing or has no generatedAt')
    } else if (age > MSE_RATIOS_MAX_AGE_DAYS) {
        console.log(
            `::warning:: mse_symbol_ratios.json is ${age.toFixed(1)} days old (max ${MSE_RATIOS_MAX_AGE_DAYS}) — run npm run scrape:mse-ratios`
        )
    } else {
        console.log(`MSE ratios age: ${age.toFixed(1)} days`)
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
