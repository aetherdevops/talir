import puppeteer from 'puppeteer'

const docId = process.argv[2] || '77751'
const url = `https://seinet.com.mk/mk/document/${docId}`

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
const downloads = []
page.on('response', async (res) => {
    const u = res.url()
    const ct = res.headers()['content-type'] || ''
    if (/pdf|octet-stream|attachment/i.test(u + ct)) {
        const buf = await res.buffer().catch(() => null)
        downloads.push({ url: u, contentType: ct, size: buf?.length ?? 0 })
    }
})

await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

// Try API fetch from page context
const api = await page.evaluate(async (id) => {
    const res = await fetch(`https://api.seinet.com.mk/public/documents/single/${id}`)
    const json = await res.json()
    const att = json?.data?.attachments?.[0]
    return { att, keys: att ? Object.keys(att) : [] }
}, Number(docId))

console.log('attachment meta:', JSON.stringify(api, null, 2))

// Click download div if present
const clicked = await page.evaluate(() => {
    const el = [...document.querySelectorAll('div[title*="Преземи"], div[title*="Download"]')][0]
    if (el) {
        el.dispatchEvent(new MouseEvent('click', { bubbles: true }))
        return el.getAttribute('title')
    }
    return null
})
console.log('clicked:', clicked)
await new Promise((r) => setTimeout(r, 5000))

console.log('downloads:', downloads)

await browser.close()
