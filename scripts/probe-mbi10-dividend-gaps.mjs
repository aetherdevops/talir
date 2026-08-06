/**
 * One-shot: list MBI10 dividend gaps vs OCR cache / Supabase extractions.
 * Usage: node scripts/probe-mbi10-dividend-gaps.mjs
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const require = createRequire(import.meta.url)

function loadEnvLocal() {
    const p = path.join(root, '.env.local')
    if (!fs.existsSync(p)) return
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const t = line.trim()
        if (!t || t.startsWith('#')) continue
        const i = t.indexOf('=')
        if (i === -1) continue
        const k = t.slice(0, i).trim()
        const v = t.slice(i + 1).trim()
        if (!(k in process.env)) process.env[k] = v
    }
}

loadEnvLocal()

const { createClient } = await import('@supabase/supabase-js')
const { parseDividendCalendarText } = await import('../lib/dividends.ts')

const MBI10 = ['ALK', 'GRNT', 'KMB', 'MPT', 'REPL', 'STB', 'TEL', 'TNB', 'TTK', 'UNI']
const cache = JSON.parse(fs.readFileSync(path.join(root, 'lib/data/dividend_ocr_cache.json'), 'utf8'))

const url = process.env.NEXT_PUBLIC_SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY
if (!url || !key) {
    console.error('Need Supabase env')
    process.exit(1)
}
const db = createClient(url, key)

const { data: docs, error: docsErr } = await db
    .from('seinet_documents')
    .select('document_id, stock_code, filed_at, url, title, attachment_ids')
    .in('stock_code', MBI10)
    .eq('document_kind', 'dividend_calendar')
    .order('filed_at', { ascending: true })

if (docsErr) {
    console.error(docsErr)
    process.exit(1)
}

const docIds = (docs ?? []).map((d) => d.document_id)
const { data: fields } = await db
    .from('document_field_extractions')
    .select('document_id, parse_status, fields, parser_version')
    .in('document_id', docIds)
    .eq('parser_version', '1.4.1')

const fieldByDoc = new Map((fields ?? []).map((f) => [f.document_id, f]))

console.log('docs', docs?.length, 'extractions 1.3.0', fields?.length)

for (const code of MBI10) {
    const rows = (docs ?? []).filter((d) => d.stock_code === code)
    console.log(`\n======== ${code} (${rows.length}) ========`)
    for (const doc of rows) {
        const f = fieldByDoc.get(doc.document_id)
        const fieldsObj = f?.fields ?? {}
        const status = f?.parse_status ?? 'no_extraction'
        const attIds = doc.attachment_ids ?? []
        const weak =
            status === 'link_only' ||
            status === 'no_extraction' ||
            fieldsObj.grossPerShare == null

        const line = [
            String(doc.filed_at).slice(0, 10),
            `doc=${doc.document_id}`,
            status,
            `gross=${fieldsObj.grossPerShare ?? '-'}`,
            `cum=${fieldsObj.cumDate ?? '-'}`,
            `ex=${fieldsObj.exDate ?? '-'}`,
            `atts=${attIds.join(',') || '-'}`,
        ].join(' | ')
        console.log(line)

        if (!weak) continue

        for (const att of attIds) {
            const cached = cache[String(att)]
            if (!cached?.text) {
                console.log(`  att ${att}: NO OCR CACHE`)
                continue
            }
            const reparsed = parseDividendCalendarText(cached.text, { fromOcr: true })
            console.log(
                `  att ${att}: reparse ${reparsed.parseStatus} gross=${reparsed.grossPerShare} cum=${reparsed.cumDate} ex=${reparsed.exDate}`
            )
            if (reparsed.grossPerShare == null || reparsed.parseStatus === 'link_only') {
                // Show amount-like lines
                const text = cached.text.replace(/\s+/g, ' ')
                const hits = []
                for (const m of text.matchAll(
                    /.{0,40}(?:gross|бруто|дивиденда|dividend|MKD|ден|per share|по акци).{0,60}/gi
                )) {
                    hits.push(m[0].replace(/\s+/g, ' ').trim())
                    if (hits.length >= 8) break
                }
                console.log('  snippets:')
                for (const h of hits) console.log('   ·', h)
            }
        }
    }
}
