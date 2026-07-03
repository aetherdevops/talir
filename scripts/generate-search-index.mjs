/**
 * Prebuild: compact search index for client-side filtering.
 * Output: lib/data/search_index.json (server imports) + public/search-index.json (client fetch)
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const derivedPath = path.join(__dirname, '../lib/data/derived_market.json')
const dataOutPath = path.join(__dirname, '../lib/data/search_index.json')
const publicOutPath = path.join(__dirname, '../public/search-index.json')

const INDEX_CODES = ['MBI10', 'OMB']

function loadJson(p) {
    return JSON.parse(fs.readFileSync(p, 'utf8'))
}

const derived = loadJson(derivedPath)
const items = []

for (const code of INDEX_CODES) {
    items.push({
        code,
        name: code,
        type: 'Index',
        q: code.toLowerCase(),
    })
}

for (const inst of derived.instruments ?? []) {
    if (!inst.code) continue
    const name = inst.name || inst.code
    items.push({
        code: inst.code,
        name,
        type: 'Stock',
        q: `${inst.code} ${name}`.toLowerCase(),
    })
}

const payload = JSON.stringify(
    { generatedAt: new Date().toISOString(), count: items.length, items },
    null,
    0
)

fs.writeFileSync(dataOutPath, payload)
fs.writeFileSync(publicOutPath, payload)
console.log(`Wrote search index: ${items.length} instruments → ${dataOutPath}`)
console.log(`Wrote search index: ${items.length} instruments → ${publicOutPath}`)
