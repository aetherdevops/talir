import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const d = JSON.parse(fs.readFileSync(path.join(root, 'lib/data/derived_dividends.json'), 'utf8'))
const r = JSON.parse(fs.readFileSync(path.join(root, 'lib/data/mse_symbol_ratios.json'), 'utf8'))

function resolveProfitYear(entry) {
    if (entry.profitYear) return entry.profitYear
    if (!entry.exDate) return null
    const exYear = Number(entry.exDate.slice(0, 4))
    const exMonth = Number(entry.exDate.slice(5, 7))
    if (exMonth <= 8) return exYear - 1
    return exYear
}

const mbi10 = ['ALK', 'GRNT', 'KMB', 'MPT', 'REPL', 'STB', 'TEL', 'TNB', 'TTK', 'UNI']
console.log('MBI10 DPS by resolved profit year:')
for (const t of mbi10) {
    const rows = (d.all || []).filter((e) => e.stockCode === t && e.grossPerShare != null)
    const years = [...new Set(rows.map((e) => resolveProfitYear(e)).filter(Boolean))].sort()
    const mse = Object.entries(r.byCode[t]?.years || {})
        .filter(([, y]) => y.dps != null)
        .map(([y]) => Number(y))
        .sort()
    const missing = mse.filter((y) => !years.includes(y))
    console.log(
        t,
        'derived',
        years.join(',') || '—',
        '| MSE',
        mse.join(',') || '—',
        missing.length ? `| MISSING ${missing.join(',')}` : '| ok'
    )
}
const tel = (d.all || []).find((e) => e.stockCode === 'TEL' && resolveProfitYear(e) === 2025)
console.log('TEL 2025', tel?.grossPerShare, tel?.source)
