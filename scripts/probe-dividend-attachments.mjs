/**
 * Probe SEInet dividend document pages for attachment URLs and text samples.
 * Usage: npx tsx scripts/probe-dividend-attachments.mjs [url]
 */
import puppeteer from 'puppeteer'

const url = process.argv[2] || 'https://seinet.com.mk/en/document/77755'

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })

const info = await page.evaluate(() => {
    const links = [...document.querySelectorAll('a')]
        .map((a) => ({
            href: a.href,
            text: (a.textContent || '').trim().slice(0, 120),
        }))
        .filter((l) => l.href && !l.href.endsWith('#'))

    const iframes = [...document.querySelectorAll('iframe')].map((f) => f.src)
    const embeds = [...document.querySelectorAll('embed, object')].map((e) => e.src || e.data)

    return {
        title: document.title,
        bodyLen: document.body.innerText.length,
        bodyPreview: document.body.innerText.replace(/\s+/g, ' ').slice(0, 800),
        links: links.slice(0, 40),
        iframes,
        embeds,
    }
})

console.log(JSON.stringify(info, null, 2))
await browser.close()
