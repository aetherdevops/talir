import { loadEnvLocal } from '../lib/load-env-local.ts'
loadEnvLocal()
import { fetchDividendDocumentText, shouldPreferOcrOverPdfText } from '../lib/seinet-document.ts'

async function main() {
    for (const id of [76019, 71693]) {
        const r = await fetchDividendDocumentText(`https://seinet.com.mk/en/document/${id}`, {
            allowOcr: true,
            documentId: id,
        })
        console.log('====', id, r?.source, 'att', r?.attachmentId, 'preferOcr', r ? shouldPreferOcrOverPdfText(r.text) : null)
        console.log(r?.text)
        console.log('---')
    }
}

main().catch((e) => {
    console.error(e)
    process.exit(1)
})
