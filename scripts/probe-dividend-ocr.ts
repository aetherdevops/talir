/**
 * Spot-check OCR on scanned dividend calendar PDFs.
 * Usage: TALIR_OCR_DIVIDENDS=1 npx tsx scripts/probe-dividend-ocr.ts
 */
import { parseDividendCalendarText } from '../lib/dividends'
import { fetchDividendDocumentText } from '../lib/seinet-document'

const SAMPLES = [
    { code: 'TEHN', url: 'https://seinet.com.mk/en/document/77755' },
    { code: 'ADIN', url: 'https://seinet.com.mk/en/document/77771' },
    { code: 'STBP', url: 'https://seinet.com.mk/en/document/77665' },
    { code: 'RADE', url: 'https://seinet.com.mk/en/document/77820' },
    { code: 'MERM', url: 'https://seinet.com.mk/en/document/77557' },
]

async function main() {
    if (process.env.TALIR_OCR_DIVIDENDS !== '1') {
        console.error('Set TALIR_OCR_DIVIDENDS=1 to run OCR spot-check.')
        process.exit(1)
    }

    console.log('OCR spot-check on 5 scanned calendar PDFs:\n')

    for (const sample of SAMPLES) {
        const result = await fetchDividendDocumentText(sample.url, {
            allowOcr: true,
        })
        if (!result) {
            console.log(`${sample.code}: no text extracted`)
            continue
        }

        const fields = parseDividendCalendarText(result.text, { fromOcr: result.source === 'ocr' })
        console.log(`${sample.code} (${result.source}):`)
        console.log(
            `  status=${fields.parseStatus} gross=${fields.grossPerShare} ex=${fields.exDate} cum=${fields.cumDate} record=${fields.recordDate}`
        )
        console.log(`  text preview: ${result.text.slice(0, 160).replace(/\s+/g, ' ')}…`)
        console.log('')
    }

    console.log('Done — OCR text is cached in lib/data/dividend_ocr_cache.json when extracted.')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
