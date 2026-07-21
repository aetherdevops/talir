/**
 * Ingest official macro series into Supabase (macro_series + macro_observations).
 * Run: npm run ingest:macro
 */
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()

import { MACRO_SERIES_CATALOG } from '../lib/macro-ingest/catalog'
import { fetchMofBudgetBalanceGdp } from '../lib/macro-ingest/mof-budget'
import { fetchPxWebSeries } from '../lib/macro-ingest/pxweb'
import { getSupabaseAdminOrNull, isSupabaseAdminConfigured } from '../lib/supabase/admin'
import type { MacroPoint } from '../lib/macro'
import fs from 'fs'
import path from 'path'

const CACHE_DIR = path.join(process.cwd(), 'lib', 'data', 'macro_cache')

function ensureCacheDir() {
    if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true })
}

function writeLocalCache(seriesId: string, points: MacroPoint[]) {
    ensureCacheDir()
    fs.writeFileSync(
        path.join(CACHE_DIR, `${seriesId}.json`),
        JSON.stringify({ fetchedAt: new Date().toISOString(), points }, null, 2)
    )
}

async function main() {
    const notes: string[] = []
    let observationCount = 0
    let errors = 0

    const db = getSupabaseAdminOrNull()
    if (!isSupabaseAdminConfigured() || !db) {
        console.warn(
            '[ingest-macro] Supabase not configured — writing local macro_cache only (no DB upsert)'
        )
    }

    let runId: string | null = null
    if (db) {
        const { data: run, error } = await db
            .from('macro_ingest_runs')
            .insert({ status: 'running' })
            .select('id')
            .single()
        if (error) {
            console.error('[ingest-macro] failed to open ingest run:', error.message)
            console.error('Apply migration 008_macro_observations.sql if tables are missing.')
        } else {
            runId = run.id as string
        }

        // Upsert series catalog
        const seriesRows = MACRO_SERIES_CATALOG.map((s) => ({
            id: s.id,
            label_en: s.labelEn,
            label_mk: s.labelMk,
            unit: s.unit,
            delta_unit: s.deltaUnit,
            frequency: s.frequency,
            category: s.category,
            kpi_order: s.kpiOrder,
            source_agency: s.sourceAgency,
            source_label: s.sourceLabel,
            source_url: s.sourceUrl,
        }))
        const { error: seriesErr } = await db.from('macro_series').upsert(seriesRows)
        if (seriesErr) {
            notes.push(`series upsert: ${seriesErr.message}`)
            errors++
        }
    }

    for (const entry of MACRO_SERIES_CATALOG) {
        try {
            let points: MacroPoint[] = []

            if (entry.mofBudget) {
                const mof = await fetchMofBudgetBalanceGdp()
                notes.push(`${entry.id}: ${mof.note}`)
                points = mof.points
            } else if (entry.pxweb) {
                points = await fetchPxWebSeries(entry.pxweb)
                notes.push(`${entry.id}: fetched ${points.length} points`)
            } else {
                notes.push(`${entry.id}: no fetch spec — skipped`)
                continue
            }

            if (!points.length) continue

            writeLocalCache(entry.id, points)
            observationCount += points.length

            if (db) {
                // Replace series observations so retracted/unpublished periods drop out
                await db.from('macro_observations').delete().eq('series_id', entry.id)
                const rows = points.map((p) => ({
                    series_id: entry.id,
                    obs_date: p.date,
                    value: p.value,
                    fetched_at: new Date().toISOString(),
                }))
                // chunk upserts
                const chunk = 500
                for (let i = 0; i < rows.length; i += chunk) {
                    const slice = rows.slice(i, i + chunk)
                    const { error } = await db.from('macro_observations').upsert(slice)
                    if (error) {
                        notes.push(`${entry.id} upsert: ${error.message}`)
                        errors++
                        break
                    }
                }
            }

            // Polite pacing for MakStat / NBStat rate limits
            await new Promise((r) => setTimeout(r, 1200))
        } catch (err) {
            errors++
            const msg = err instanceof Error ? err.message : String(err)
            notes.push(`${entry.id}: ERROR ${msg}`)
            console.error(`[ingest-macro] ${entry.id}`, msg)
        }
    }

    const status = errors === 0 ? 'ok' : observationCount > 0 ? 'partial' : 'error'
    const finishedAt = new Date().toISOString()

    if (db && runId) {
        await db
            .from('macro_ingest_runs')
            .update({
                finished_at: finishedAt,
                status,
                notes: notes.join('\n'),
                observation_count: observationCount,
            })
            .eq('id', runId)
    }

    // Always write a local ingest stamp for generate-macro fallback
    ensureCacheDir()
    fs.writeFileSync(
        path.join(CACHE_DIR, '_last_run.json'),
        JSON.stringify(
            {
                finishedAt,
                status,
                observationCount,
                notes,
            },
            null,
            2
        )
    )

    console.log(`[ingest-macro] done status=${status} observations=${observationCount}`)
    for (const n of notes) console.log('  ·', n)
    if (status === 'error') process.exitCode = 1
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
