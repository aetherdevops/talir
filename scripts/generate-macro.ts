/**
 * Build lib/data/derived_macro.json from Supabase (preferred) or local macro_cache / prior JSON.
 * Run: npm run generate:macro
 */
import fs from 'fs'
import path from 'path'
import { loadEnvLocal } from '../lib/load-env-local'

loadEnvLocal()

import { MACRO_SERIES_CATALOG } from '../lib/macro-ingest/catalog'
import { getSupabaseAdminOrNull } from '../lib/supabase/admin'
import type { MacroFile, MacroNewsItem, MacroPoint, MacroSeries } from '../lib/macro'

const dataDir = path.join(process.cwd(), 'lib', 'data')
const outPath = path.join(dataDir, 'derived_macro.json')
const cacheDir = path.join(dataDir, 'macro_cache')

function readPrior(): MacroFile | null {
    if (!fs.existsSync(outPath)) return null
    try {
        return JSON.parse(fs.readFileSync(outPath, 'utf8')) as MacroFile
    } catch {
        return null
    }
}

function readCachePoints(seriesId: string): MacroPoint[] | null {
    const p = path.join(cacheDir, `${seriesId}.json`)
    if (!fs.existsSync(p)) return null
    try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as { points?: MacroPoint[] }
        return Array.isArray(raw.points) ? raw.points : null
    } catch {
        return null
    }
}

function readLastRun(): { finishedAt: string | null; status: string | null } {
    const p = path.join(cacheDir, '_last_run.json')
    if (!fs.existsSync(p)) return { finishedAt: null, status: null }
    try {
        const raw = JSON.parse(fs.readFileSync(p, 'utf8')) as {
            finishedAt?: string
            status?: string
        }
        return { finishedAt: raw.finishedAt ?? null, status: raw.status ?? null }
    } catch {
        return { finishedAt: null, status: null }
    }
}

function defaultNews(): MacroNewsItem[] {
    return [
        {
            id: 'n1',
            date: '2026-06-30',
            titleEn: 'SSO: Industrial production indices updated (2021=100 base)',
            titleMk: 'ДЗС: Ажурирани индекси на индустриско производство (база 2021=100)',
        },
        {
            id: 'n2',
            date: '2026-06-03',
            titleEn: 'SSO: Quarterly GDP by production approach (ESA 2010) published',
            titleMk: 'ДЗС: Објавен квартален БДП според производствен пристап (ЕСС 2010)',
        },
        {
            id: 'n3',
            date: '2026-05-29',
            titleEn: 'SSO: Labour Force Survey quarterly rates released',
            titleMk: 'ДЗС: Објавени квартални стапки од Анкетата за работна сила',
        },
    ]
}

function sanitizePoints(points: MacroPoint[]): MacroPoint[] {
    const horizon = new Date()
    horizon.setMonth(horizon.getMonth() + 1)
    horizon.setDate(1)
    const maxMs = horizon.getTime()
    return points
        .filter((p) => {
            const ms = Date.parse(p.date)
            if (Number.isNaN(ms) || ms > maxMs) return false
            // Drop empty IP index cells that became −100
            if (p.value === -100) return false
            return Number.isFinite(p.value)
        })
        .sort((a, b) => a.date.localeCompare(b.date))
}

async function loadPointsFromDb(seriesId: string): Promise<MacroPoint[] | null> {
    const db = getSupabaseAdminOrNull()
    if (!db) return null
    const { data, error } = await db
        .from('macro_observations')
        .select('obs_date, value')
        .eq('series_id', seriesId)
        .order('obs_date', { ascending: true })
    if (error || !data?.length) return null
    return sanitizePoints(
        data.map((row) => ({
            date: String(row.obs_date).slice(0, 10),
            value: Number(row.value),
        }))
    )
}

async function loadLastIngestedAt(): Promise<string | null> {
    const db = getSupabaseAdminOrNull()
    if (db) {
        const { data } = await db
            .from('macro_ingest_runs')
            .select('finished_at, status')
            .in('status', ['ok', 'partial'])
            .order('finished_at', { ascending: false })
            .limit(1)
            .maybeSingle()
        if (data?.finished_at) return String(data.finished_at)
    }
    return readLastRun().finishedAt
}

async function main() {
    const prior = readPrior()
    const series: MacroSeries[] = []

    for (const entry of MACRO_SERIES_CATALOG) {
        const fromDb = await loadPointsFromDb(entry.id)
        const fromCache = readCachePoints(entry.id)
        const fromPrior = prior?.series.find((s) => s.id === entry.id)?.points ?? null
        const points = sanitizePoints(fromDb ?? fromCache ?? fromPrior ?? [])

        series.push({
            id: entry.id,
            labelEn: entry.labelEn,
            labelMk: entry.labelMk,
            unit: entry.unit,
            deltaUnit: entry.deltaUnit,
            frequency: entry.frequency,
            category: entry.category,
            sourceAgency: entry.sourceAgency,
            sourceLabel: entry.sourceLabel,
            sourceUrl: entry.sourceUrl,
            kpiOrder: entry.kpiOrder,
            points,
        })
    }

    const allDates = series.flatMap((s) => s.points.map((p) => p.date)).sort()
    const asOfDate = allDates.length ? allDates[allDates.length - 1]! : new Date().toISOString().slice(0, 10)
    const lastIngestedAt = await loadLastIngestedAt()

    const hasOfficial = series.some((s) => s.points.length > 0 && s.sourceAgency !== 'Dummy')
    const file: MacroFile = {
        generatedAt: new Date().toISOString(),
        asOfDate,
        lastIngestedAt,
        disclaimerEn: hasOfficial
            ? 'Official statistics from SSO (MakStat), NBRM (NBStat), and MoF where available · not live · revisions possible.'
            : 'Waiting for first successful ingest — prior placeholder points may still appear for some series.',
        disclaimerMk: hasOfficial
            ? 'Официјална статистика од ДЗС (MakStat), НБРМ (NBStat) и МФ каде е достапно · не во живо · можни ревизии.'
            : 'Се чека прво успешно собирање — за некои серии може да се гледаат претходни пример-точки.',
        series,
        news: prior?.news?.length ? prior.news : defaultNews(),
    }

    fs.writeFileSync(outPath, JSON.stringify(file, null, 2) + '\n')
    const withPoints = series.filter((s) => s.points.length > 0).length
    console.log(
        `[generate-macro] wrote ${outPath} (${withPoints}/${series.length} series with points, asOf=${asOfDate}, lastIngested=${lastIngestedAt ?? 'null'})`
    )
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
