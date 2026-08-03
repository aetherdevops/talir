import { loadEnvLocal } from '../lib/load-env-local.ts'
loadEnvLocal()
import { fetchDividendDocumentText } from '../lib/seinet-document.ts'
import { parseDividendCalendarText } from '../lib/dividends.ts'

async function main() {
    const docs = [
        { code: 'ALK', id: 76019, url: 'https://seinet.com.mk/en/document/76019' },
        { code: 'ALK', id: 71693, url: 'https://seinet.com.mk/en/document/71693' },
        { code: 'STB', id: 51408, url: 'https://seinet.com.mk/en/document/51408' },
        { code: 'STB', id: 55880, url: 'https://seinet.com.mk/en/document/55880' },
    ]

    for (const d of docs) {
        const result = await fetchDividendDocumentText(d.url, {
            allowOcr: true,
            documentId: d.id,
        })
        if (!result) {
            console.log(d.code, d.id, 'NO TEXT')
            continue
        }
        const parsed = parseDividendCalendarText(result.text, { fromOcr: result.source === 'ocr' })
        console.log(
            d.code,
            d.id,
            'src=' + result.source,
            'att=' + result.attachmentId,
            'len=' + result.text.length,
            'gross=' + parsed.grossPerShare,
            'status=' + parsed.parseStatus,
            'cum=' + parsed.cumDate
        )
        console.log('  ', result.text.replace(/\s+/g, ' ').slice(0, 320))
    }
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
