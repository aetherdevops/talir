/**
 * Verify homepage mobile: no document horizontal overflow with leaderboard row rendered.
 * Usage: npm run dev (separate terminal), then node scripts/verify-home-mobile.mjs
 */
import puppeteer from 'puppeteer'

const BASE = process.env.BASE_URL ?? 'http://localhost:3000'
const WIDTHS = [320, 360, 390]

async function measure(page) {
    return page.evaluate(() => {
        const doc = document.documentElement
        const recent = document.getElementById('recent-results-heading')?.closest('section')
        const expected = document.getElementById('expected-results-heading')?.closest('section')
        return {
            innerWidth: window.innerWidth,
            scrollWidth: doc.scrollWidth,
            overflow: doc.scrollWidth !== window.innerWidth,
            recentHeight: recent?.getBoundingClientRect().height ?? 0,
            expectedHeight: expected?.getBoundingClientRect().height ?? 0,
            hasLeaderboardRow: Boolean(document.getElementById('home-leaderboards-heading')),
        }
    })
}

const browser = await puppeteer.launch({ headless: true })
const page = await browser.newPage()

console.log(`\nHomepage mobile verification — ${BASE}\n`)

for (const width of WIDTHS) {
    await page.setViewport({ width, height: 800, deviceScaleFactor: 1 })
    await page.goto(BASE, { waitUntil: 'networkidle2', timeout: 60000 })
    const m = await measure(page)
    const ok = !m.overflow && m.scrollWidth === m.innerWidth
    console.log(
        `[${width}px] doc.scrollWidth=${m.scrollWidth} innerWidth=${m.innerWidth} → ${
            ok ? 'PASS' : 'FAIL'
        } (leaderboard=${m.hasLeaderboardRow})`
    )
    console.log(
        `         calendar sections: recent=${Math.round(m.recentHeight)}px expected=${Math.round(m.expectedHeight)}px`
    )
}

await browser.close()

console.log('\nBefore/after note: compressed calendar rows target ~32–36px each + ~24px header/subtitle per section.\n')
