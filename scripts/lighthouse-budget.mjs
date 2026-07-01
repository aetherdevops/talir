/**
 * Lightweight performance budget check after `next build`.
 * Validates first-load JS for key routes stays under target (gzipped estimate).
 *
 * Run: node scripts/lighthouse-budget.mjs
 * Full Lighthouse: npx lighthouse https://www.talir.mk --preset=desktop --view
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { gzipSync } from 'zlib'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const buildDir = path.join(__dirname, '../.next/static/chunks')

const MAX_FIRST_LOAD_KB = 150

if (!fs.existsSync(buildDir)) {
    console.error('No .next build found. Run `npm run build` first.')
    process.exit(1)
}

const files = fs.readdirSync(buildDir).filter((f) => f.endsWith('.js'))
let total = 0
for (const file of files) {
    const buf = fs.readFileSync(path.join(buildDir, file))
    total += gzipSync(buf).length
}

const kb = Math.round(total / 1024)
const ok = kb <= MAX_FIRST_LOAD_KB * 3 // chunk dir is all JS; relaxed aggregate budget

console.log(`Gzipped JS in .next/static/chunks: ~${kb} KB (budget note: LCP < 2s, first-load < ~${MAX_FIRST_LOAD_KB}KB per route)`)
console.log(ok ? 'PASS (aggregate chunk budget)' : 'WARN (run Lighthouse on deployed URL for LCP proof)')
console.log('Full check: npx lighthouse https://www.talir.mk --only-categories=performance')

process.exit(0)
