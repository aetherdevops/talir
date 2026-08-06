import * as cheerio from 'cheerio'

const arg = process.argv[2] || 'symbol/NLB'
const url = arg.startsWith('http') ? arg : `https://www.mse.mk/en/${arg}`
const res = await fetch(url)
const html = await res.text()
const $ = cheerio.load(html)

const ids = []
$('[id]').each((_, el) => {
    const id = $(el).attr('id') || ''
    if (/sei|news|issuer/i.test(id)) ids.push(id)
})
console.log('ids:', [...new Set(ids)].join(', '))

for (const sel of ['#seiNetIssuerNews', '#seiNetIssuerFinancialNews', '#seiNetIssuerLatestNews', '#issuerNews', '.issuer-news']) {
    console.log(sel, $(sel).length, 'links', $(`${sel} a`).length)
    $(`${sel} a`).slice(0, 3).each((_, el) => {
        console.log('  ', $(el).text().trim().slice(0, 90))
    })
}

$('a[href*="seinet"]').each((_, el) => {
    const t = $(el).text().trim()
    if (!/dividend calendar/i.test(t)) return
    let p = $(el).parent()
    for (let i = 0; i < 5; i++) {
        const id = p.attr('id')
        if (id) {
            console.log('dividend in container id:', id)
            break
        }
        p = p.parent()
    }
})
