import * as cheerio from 'cheerio'

const codes = process.argv.slice(2).length ? process.argv.slice(2) : ['KMB', 'ALK', 'TEL']
const BASE = 'https://www.mse.mk'

function parseDate(title, siblingDate) {
    if (siblingDate?.trim()) {
        const us = siblingDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
        if (us) return `${us[3]}-${us[1].padStart(2, '0')}-${us[2].padStart(2, '0')}`
        const eu = siblingDate.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/)
        if (eu) return `${eu[3]}-${eu[2].padStart(2, '0')}-${eu[1].padStart(2, '0')}`
    }
    const fromTitle = title.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/)
    if (fromTitle) {
        return `${fromTitle[3]}-${fromTitle[1].padStart(2, '0')}-${fromTitle[2].padStart(2, '0')}`
    }
    return ''
}

async function scrape(code) {
    const url = `${BASE}/en/symbol/${code}`
    const res = await fetch(url)
    if (!res.ok) {
        console.log(`\n=== ${code} === FAILED HTTP ${res.status}`)
        return
    }
    const html = await res.text()
    const $ = cheerio.load(html)
    const links = []
    const seen = new Set()

    $('div#seiNetIssuerFinancialNews a').each((_, el) => {
        const href = $(el).attr('href')
        const text = $(el).text().trim()
        if (!href || !(href.includes('seinet.com.mk') || href.includes('ViewNews'))) return
        const absoluteUrl = href.startsWith('http') ? href : `https://seinet.com.mk${href}`
        const dedupeKey = absoluteUrl.toLowerCase()
        if (seen.has(dedupeKey)) return
        seen.add(dedupeKey)

        const row = $(el).closest('tr, li, div')
        const rowText = row.text().replace(/\s+/g, ' ').trim()
        const siblingDate =
            rowText.match(/(\d{1,2}\/\d{1,2}\/\d{4})/)?.[1] ??
            rowText.match(/(\d{1,2}\.\d{1,2}\.\d{4})/)?.[1] ??
            ''

        links.push({
            title: text,
            url: absoluteUrl,
            date: parseDate(text, siblingDate),
        })
    })

    links.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

    const container = $('#seiNetIssuerFinancialNews')
    console.log(`\n=== ${code} ===`)
    console.log(`  Container found: ${container.length > 0}, raw links: ${container.find('a').length}, parsed: ${links.length}`)
    if (links.length === 0) {
        // probe alternate selectors
        const alt = $('a[href*="seinet.com.mk"], a[href*="ViewNews"]')
        console.log(`  Alt seinet links on page: ${alt.length}`)
        return
    }
    console.log(`  Newest date: ${links[0].date || '(undated)'}`)
    console.log(`  Newest title: ${links[0].title.slice(0, 100)}`)
    console.log('  Top 3:')
    links.slice(0, 3).forEach((l) => console.log(`    ${l.date || '????-??-??'}  ${l.title.slice(0, 90)}`))
}

for (const code of codes) {
    await scrape(code)
}
