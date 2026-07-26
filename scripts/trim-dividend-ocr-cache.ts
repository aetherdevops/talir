/**
 * Trim dividend_ocr_cache.json to attachment IDs referenced by current
 * derived_dividends / seinet docs (or all keys in cache that appear in failures).
 *
 * Usage: npm run trim:dividend-ocr-cache
 */
import fs from 'fs'
import path from 'path'
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()

import { trimOcrCacheToAttachmentIds, loadOcrCache } from '../lib/document-ocr'
import { parseDocumentIdFromUrl } from '../lib/seinet-document'
import { getSupabaseAdminOrNull } from '../lib/supabase/admin'

async function collectKeepIds(): Promise<Set<number>> {
    const keep = new Set<number>()
    const dataDir = path.join(process.cwd(), 'lib', 'data')
    const derivedPath = path.join(dataDir, 'derived_dividends.json')

    if (fs.existsSync(derivedPath)) {
        try {
            const raw = JSON.parse(fs.readFileSync(derivedPath, 'utf8')) as {
                all?: Array<{ url: string }>
            }
            for (const entry of raw.all ?? []) {
                const id = parseDocumentIdFromUrl(entry.url)
                if (id != null) keep.add(id)
            }
        } catch {
            // ignore
        }
    }

    const db = getSupabaseAdminOrNull()
    if (db) {
        const { data } = await db
            .from('seinet_documents')
            .select('attachment_ids')
            .eq('document_kind', 'dividend_calendar')
        for (const row of data ?? []) {
            const ids = Array.isArray(row.attachment_ids) ? row.attachment_ids : []
            for (const id of ids) keep.add(Number(id))
        }
    }

    // Also keep any attachment keys already in cache that match derived doc fetches
    // Prefer attachment IDs from cache that are numeric and in keep via store;
    // if store empty, keep all current cache (no-op trim)
    return keep
}

async function main(): Promise<void> {
    const before = Object.keys(loadOcrCache()).length
    const keep = await collectKeepIds()

    if (keep.size === 0) {
        console.log('No attachment IDs to keep — refusing to wipe OCR cache.')
        process.exit(0)
    }

    // Cache is keyed by attachmentId; keep set may be documentIds from derived.
    // Prefer attachment IDs from Supabase; if we only have doc IDs, intersect with cache is empty.
    // Safer: only trim when we have attachment ids from store.
    const cache = loadOcrCache()
    const attachmentKeep = new Set<string>()
    for (const key of Object.keys(cache)) {
        if (keep.has(Number(key))) attachmentKeep.add(key)
    }

    // If store returned attachment ids, use those; else keep intersection empty means use all keep as attachment ids
    const ids =
        attachmentKeep.size > 0
            ? [...attachmentKeep]
            : [...keep].map(String).filter((k) => k in cache)

    if (ids.length === 0 && Object.keys(cache).length > 0) {
        console.log(
            `OCR cache has ${before} entries but none match known attachment IDs — skip trim (need Supabase attachment_ids).`
        )
        process.exit(0)
    }

    const removed = trimOcrCacheToAttachmentIds(ids)
    const after = Object.keys(loadOcrCache()).length
    console.log(`OCR cache trim: ${before} → ${after} (removed ${removed})`)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
