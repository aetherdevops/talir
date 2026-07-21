/**
 * PxWeb JSON-stat2 client for MakStat / NBStat.
 */

import type { MacroPoint } from '../macro'
import type { PxWebQuerySpec } from './catalog'

type PxMetaVar = {
    code: string
    text: string
    values: string[]
    valueTexts?: string[]
}

type PxMeta = {
    title?: string
    variables: PxMetaVar[]
}

type JsonStat2 = {
    id: string[]
    size: number[]
    value: (number | null)[]
    dimension: Record<
        string,
        {
            category: {
                index: Record<string, number>
                label?: Record<string, string>
            }
        }
    >
}

const MONTH_NAME_TO_NUM: Record<string, string> = {
    January: '01',
    February: '02',
    March: '03',
    April: '04',
    May: '05',
    June: '06',
    July: '07',
    August: '08',
    September: '09',
    October: '10',
    November: '11',
    December: '12',
}

function sleep(ms: number) {
    return new Promise((r) => setTimeout(r, ms))
}

async function fetchJson<T>(url: string, init?: RequestInit, attempt = 0): Promise<T> {
    const res = await fetch(url, {
        ...init,
        headers: {
            Accept: 'application/json',
            ...(init?.headers ?? {}),
        },
    })
    if (res.status === 429 && attempt < 5) {
        const wait = 2000 * (attempt + 1)
        await sleep(wait)
        return fetchJson(url, init, attempt + 1)
    }
    if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(`HTTP ${res.status} ${url}: ${body.slice(0, 200)}`)
    }
    return (await res.json()) as T
}

function resolveSelection(
    meta: PxMeta,
    code: string,
    sel: string[] | 'all' | `tail:${number}` | `head:${number}`
): string[] {
    const variable = meta.variables.find((v) => v.code === code)
    if (!variable) throw new Error(`Variable ${code} not found in table`)
    if (sel === 'all') return [...variable.values]
    if (typeof sel === 'string' && sel.startsWith('tail:')) {
        const n = Number(sel.slice(5))
        return variable.values.slice(-n)
    }
    if (typeof sel === 'string' && sel.startsWith('head:')) {
        const n = Number(sel.slice(5))
        return variable.values.slice(0, n)
    }
    return sel
}

function parseTimeLabel(label: string, yearHint?: string): string | null {
    // 2024M07 / 2024М07 (Cyrillic M)
    const m1 = label.match(/^(\d{4})\s*[MМmм]\s*(\d{1,2})$/)
    if (m1) return `${m1[1]}-${m1[2].padStart(2, '0')}-01`

    // 2024Q1 / 2017Q01
    const q1 = label.match(/^(\d{4})\s*[Qq]\s*0?([1-4])$/)
    if (q1) {
        const month = String(Number(q1[2]) * 3).padStart(2, '0')
        return `${q1[1]}-${month}-01`
    }

    // 201701 style quarter codes (YYYYQQ with QQ=01..04)
    const q2 = label.match(/^(\d{4})0([1-4])$/)
    if (q2) {
        const month = String(Number(q2[2]) * 3).padStart(2, '0')
        return `${q2[1]}-${month}-01`
    }

    // Month name alone — needs year from paired dimension
    if (MONTH_NAME_TO_NUM[label] && yearHint) {
        return `${yearHint}-${MONTH_NAME_TO_NUM[label]}-01`
    }

    // Plain year
    if (/^\d{4}$/.test(label)) return `${label}-12-01`

    return null
}

function transformValue(
    raw: number,
    mode: PxWebQuerySpec['valueTransform']
): number {
    if (mode === 'indexMinus100') return Math.round((raw - 100) * 100) / 100
    return raw
}

/**
 * IP table is Year × Sector × Month — need special cartesian parse.
 * Generic json-stat2 walker for n dimensions.
 */
export function pointsFromJsonStat(
    data: JsonStat2,
    valueTransform: PxWebQuerySpec['valueTransform'] = 'identity',
    timeCodeHint?: string
): MacroPoint[] {
    const dims = data.id
    const sizes = data.size
    const values = data.value

    const dimKeys: string[][] = dims.map((dimId) => {
        const indexMap = data.dimension[dimId]?.category.index ?? {}
        const labels = data.dimension[dimId]?.category.label ?? {}
        const ordered = Object.entries(indexMap)
            .sort((a, b) => a[1] - b[1])
            .map(([key]) => labels[key] ?? key)
        return ordered
    })

    // Prefer explicit time hint; else first dim that looks temporal
    let timeDim = timeCodeHint ? dims.indexOf(timeCodeHint) : -1
    if (timeDim < 0) {
        timeDim = dims.findIndex((d) => /месец|month|тримесеч|quarter|година|year|period/i.test(d))
    }
    if (timeDim < 0) timeDim = 0

    // For Year × Month tables, combine year + month dims
    const yearDim = dims.findIndex((d) => /година|year/i.test(d))
    const monthDim = dims.findIndex((d) => /месец|month/i.test(d) && d !== dims[yearDim])

    const points: MacroPoint[] = []
    const total = values.length

    for (let flat = 0; flat < total; flat++) {
        const raw = values[flat]
        if (raw == null || Number.isNaN(Number(raw))) continue

        // Decode multi-index
        const coords: number[] = []
        let rem = flat
        for (let d = dims.length - 1; d >= 0; d--) {
            const size = sizes[d] ?? 1
            coords[d] = rem % size
            rem = Math.floor(rem / size)
        }

        let date: string | null = null
        if (yearDim >= 0 && monthDim >= 0) {
            const yearLabel = dimKeys[yearDim]?.[coords[yearDim]!] ?? ''
            const monthLabel = dimKeys[monthDim]?.[coords[monthDim]!] ?? ''
            if (/structure/i.test(monthLabel)) continue
            date = parseTimeLabel(monthLabel, yearLabel.replace(/\D/g, '').slice(0, 4))
        } else {
            const timeLabel = dimKeys[timeDim]?.[coords[timeDim]!] ?? ''
            date = parseTimeLabel(timeLabel)
        }

        if (!date) continue

        // Skip unpublished future periods and empty IP cells (0 → −100 after transform)
        const today = new Date()
        const horizon = new Date(today.getFullYear(), today.getMonth() + 1, 1)
        if (Date.parse(date) > horizon.getTime()) continue
        if (valueTransform === 'indexMinus100' && Number(raw) === 0) continue

        points.push({
            date,
            value: transformValue(Number(raw), valueTransform),
        })
    }

    // Dedupe by date (keep last)
    const byDate = new Map<string, number>()
    for (const p of points) byDate.set(p.date, p.value)
    return [...byDate.entries()]
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, value]) => ({ date, value }))
}

export async function fetchPxWebSeries(spec: PxWebQuerySpec): Promise<MacroPoint[]> {
    const tableUrl = `${spec.baseUrl}/${spec.tablePath}`
    const meta = await fetchJson<PxMeta>(tableUrl)
    await sleep(800)

    const query = Object.entries(spec.selections).map(([code, sel]) => ({
        code,
        selection: {
            filter: 'item' as const,
            values: resolveSelection(meta, code, sel),
        },
    }))

    const body = {
        query,
        response: { format: 'json-stat2' },
    }

    const data = await fetchJson<JsonStat2>(tableUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })

    return pointsFromJsonStat(data, spec.valueTransform, spec.timeCodeHint)
}
