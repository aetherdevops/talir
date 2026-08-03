/**
 * Deep probe: find PDF/attachment URLs on SEInet document pages.
 */
import puppeteer from 'puppeteer'

const url = process.argv[2] || 'https://seinet.com.mk/mk/document/77751'

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

const info = await page.evaluate(() => {
    const allLinks = [...document.querySelectorAll('a')]
    const pdfLike = allLinks
        .map((a) => ({ href: a.href, text: (a.textContent || '').trim(), onclick: a.getAttribute('onclick') }))
        .filter((l) => /\.pdf|download|attachment|document/i.test(l.href + l.text))

    const spans = [...document.querySelectorAll('span, div, p, td')]
        .map((el) => (el.textContent || '').trim())
        .filter((t) => /\.pdf/i.test(t))
        .slice(0, 10)

    const htmlSnippets = document.body.innerHTML.match(/[^"']+\.pdf[^"']*/gi)?.slice(0, 15) ?? []

    return { pdfLike, pdfTextNodes: spans, htmlPdfSnippets: htmlSnippets }
})

console.log(JSON.stringify(info, null, 2))

const docId = url.match(/document\/(\d+)/)?.[1]
console.log('\nDoc ID:', docId)

await browser.close()
