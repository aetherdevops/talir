import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const d = JSON.parse(fs.readFileSync(path.join(root, 'lib/data/derived_dividends.json'), 'utf8'))
const mbi10 = ['ALK', 'GRNT', 'KMB', 'MPT', 'REPL', 'STB', 'TEL', 'TNB', 'TTK', 'UNI']
const list = d.all || []

for (const t of mbi10) {
    const rows = list
        .filter((e) => e.stockCode === t)
        .sort((a, b) => String(a.filedAt).localeCompare(String(b.filedAt)))
    console.log(`\n### ${t} (${rows.length})`)
    console.log('| Filed | PY | Status | Gross DPS | Cum | Ex | Record | Pay start | Pay end |')
    console.log('|---|---|---|---:|---|---|---|---|---|')
    for (const e of rows) {
        const g =
            e.grossPerShare == null
                ? '—'
                : Number.isInteger(e.grossPerShare)
                  ? String(e.grossPerShare)
                  : String(Number(e.grossPerShare.toFixed(4)))
        console.log(
            '| ' +
                [
                    String(e.filedAt).slice(0, 10),
                    e.profitYear ?? '—',
                    e.parseStatus,
                    g,
                    e.cumDate || '—',
                    e.exDate || '—',
                    e.recordDate || '—',
                    e.paymentStart || '—',
                    e.paymentEnd || '—',
                ].join(' | ') +
                ' |'
        )
    }
}
