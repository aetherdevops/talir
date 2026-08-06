import puppeteer from 'puppeteer'

const url = process.argv[2] || 'https://seinet.com.mk/en/document/77603'
const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()
await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 })
const links = await page.evaluate(() =>
    [...document.querySelectorAll('a')].map((a) => ({ href: a.href, text: a.textContent?.trim().slice(0, 120) }))
)
console.log(links.slice(0, 20))
await browser.close()
