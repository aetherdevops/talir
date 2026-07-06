/**
 * Scrapes MSE issuer pages for Cyrillic names and market capitalization (000 MKD).
 * Output: lib/data/issuer_meta.json
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const summaryPath = path.join(__dirname, '../lib/data/market_summary.json')
const outPath = path.join(__dirname, '../lib/data/issuer_meta.json')

const CHUNK = 6
const DELAY_MS = 400

function issuerSlugFromLatinName(name) {
    return name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
}

function latinToMacedonianCyrillic(name) {
    if (!name) return ''
    const MULTI = [
        ['Dzh', 'Џ'], ['dzh', 'џ'], ['Zh', 'Ж'], ['zh', 'ж'], ['Ch', 'Ч'], ['ch', 'ч'],
        ['Sh', 'Ш'], ['sh', 'ш'], ['Nj', 'Њ'], ['nj', 'њ'], ['Lj', 'Љ'], ['lj', 'љ'],
        ['Kj', 'Ќ'], ['kj', 'ќ'], ['Gj', 'Ѓ'], ['gj', 'ѓ'], ['Dz', 'Ѕ'], ['dz', 'ѕ'],
    ]
    const SINGLE = {
        A: 'А', B: 'Б', C: 'Ц', D: 'Д', E: 'Е', F: 'Ф', G: 'Г', H: 'Х', I: 'И', J: 'Ј',
        K: 'К', L: 'Л', M: 'М', N: 'Н', O: 'О', P: 'П', Q: 'К', R: 'Р', S: 'С', T: 'Т',
        U: 'У', V: 'В', W: 'В', X: 'Кс', Y: 'Ј', Z: 'З',
        a: 'а', b: 'б', c: 'ц', d: 'д', e: 'е', f: 'ф', g: 'г', h: 'х', i: 'и', j: 'ј',
        k: 'к', l: 'л', m: 'м', n: 'н', o: 'о', p: 'п', q: 'к', r: 'р', s: 'с', t: 'т',
        u: 'у', v: 'в', w: 'в', x: 'кс', y: 'ј', z: 'з',
    }
    const PLACES = {
        Skopje: 'Скопје', Prilep: 'Прилеп', Bitola: 'Битола', Tetovo: 'Тетово',
        Kavadarci: 'Кавадарци', Strumica: 'Струмица', Ohrid: 'Охрид', Debar: 'Дебар',
        Kumanovo: 'Куманово', Berovo: 'Берово', Nikole: 'Николе', Sveti: 'Свети',
    }

    let text = name.replace(/\s+/g, ' ').trim()
    text = text.replace(/\bAD\b/g, 'АД')
    for (const [latin, cyrillic] of Object.entries(PLACES)) {
        text = text.replace(new RegExp(`\\b${latin}\\b`, 'g'), cyrillic)
    }

    let out = ''
    let index = 0
    while (index < text.length) {
        let matched = false
        for (const [latin, cyrillic] of MULTI) {
            if (text.startsWith(latin, index)) {
                out += cyrillic
                index += latin.length
                matched = true
                break
            }
        }
        if (matched) continue
        const char = text[index]
        out += SINGLE[char] ?? char
        index += 1
    }
    return out
}

function isExcludedCode(code) {
    if (code === 'MBI10' || code === 'OMB') return true
    if (/^M\d/.test(code) || code.startsWith('RMDEN')) return true
    return false
}

async function fetchText(url) {
    const response = await fetch(url, { headers: { 'User-Agent': 'Talir/1.0 (data pipeline)' } })
    if (!response.ok) return null
    return response.text()
}

function parseMarketCapThousands(html) {
    const index = html.indexOf('Market capitalization')
    if (index < 0) return undefined
    const slice = html.slice(index, index + 400)
    const match = slice.match(/td-right[^>]*>\s*([0-9,]+)/)
    if (!match) return undefined
    const value = Number(match[1].replace(/,/g, ''))
    return Number.isFinite(value) && value > 0 ? value : undefined
}

function parseNameMk(html) {
    const titleMatch = html.match(/Податоци за издавачот\s*-\s*([^"<]+)/)
    if (titleMatch?.[1]) return titleMatch[1].trim()
    const metaMatch = html.match(/content="[^"]*-\s*([А-Ша-шЃѓЅѕЈјЉљЊњЌќЏџ][^"]+)"/)
    return metaMatch?.[1]?.trim() || undefined
}

async function scrapeIssuer(code, latinName) {
    const slug = issuerSlugFromLatinName(latinName)
    const [enHtml, mkHtml] = await Promise.all([
        fetchText(`https://www.mse.mk/en/issuer/${slug}/`),
        fetchText(`https://www.mse.mk/mk/issuer/${slug}/`),
    ])

    const entry = {}

    if (enHtml) {
        const cap = parseMarketCapThousands(enHtml)
        if (cap != null) entry.marketCapThousandsMkd = cap
    }

    if (mkHtml) {
        const nameMk = parseNameMk(mkHtml)
        if (nameMk) entry.nameMk = nameMk
    }

    if (!entry.nameMk) {
        entry.nameMk = latinToMacedonianCyrillic(latinName)
    }

    return entry
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
    const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'))
    const equities = summary.filter((item) => item.code && item.name && !isExcludedCode(item.code))

    const meta = {}
    let done = 0

    for (let i = 0; i < equities.length; i += CHUNK) {
        const chunk = equities.slice(i, i + CHUNK)
        const results = await Promise.all(
            chunk.map(async (item) => {
                try {
                    const entry = await scrapeIssuer(item.code, item.name.trim())
                    return [item.code, entry]
                } catch {
                    return [item.code, { nameMk: latinToMacedonianCyrillic(item.name.trim()) }]
                }
            })
        )

        for (const [code, entry] of results) {
            meta[code] = entry
            done += 1
        }

        process.stdout.write(`\rissuer meta: ${done}/${equities.length}`)
        if (i + CHUNK < equities.length) await sleep(DELAY_MS)
    }

    fs.writeFileSync(
        outPath,
        JSON.stringify(
            {
                generatedAt: new Date().toISOString(),
                count: Object.keys(meta).length,
                issuers: meta,
            },
            null,
            2
        )
    )
    console.log(`\nWrote ${outPath}`)
}

main().catch((error) => {
    console.error(error)
    process.exit(1)
})
