/**
 * Negative cache for failed dividend document fetches.
 * Skip retry for FAILURE_TTL_MS unless TALIR_PARSE_FORCE=1.
 */
import fs from 'fs'
import path from 'path'

const FAILURES_PATH = path.join(process.cwd(), 'lib', 'data', 'dividend_fetch_failures.json')
const FAILURE_TTL_MS = 7 * 24 * 60 * 60 * 1000

export interface FetchFailureEntry {
    last_failed_at: string
    attempts: number
    reason?: string
}

export type FetchFailuresFile = Record<string, FetchFailureEntry>

export function loadFetchFailures(): FetchFailuresFile {
    if (!fs.existsSync(FAILURES_PATH)) return {}
    try {
        return JSON.parse(fs.readFileSync(FAILURES_PATH, 'utf8')) as FetchFailuresFile
    } catch {
        return {}
    }
}

export function saveFetchFailures(data: FetchFailuresFile): void {
    fs.mkdirSync(path.dirname(FAILURES_PATH), { recursive: true })
    fs.writeFileSync(FAILURES_PATH, JSON.stringify(data, null, 2))
}

export function shouldSkipFailedFetch(docKey: string, now = Date.now()): boolean {
    if (process.env.TALIR_PARSE_FORCE === '1') return false
    const row = loadFetchFailures()[docKey]
    if (!row) return false
    const age = now - new Date(row.last_failed_at).getTime()
    return Number.isFinite(age) && age < FAILURE_TTL_MS
}

export function recordFetchFailure(docKey: string, reason?: string): void {
    const data = loadFetchFailures()
    const prev = data[docKey]
    data[docKey] = {
        last_failed_at: new Date().toISOString(),
        attempts: (prev?.attempts ?? 0) + 1,
        reason,
    }
    saveFetchFailures(data)
}

export function clearFetchFailure(docKey: string): void {
    const data = loadFetchFailures()
    if (!(docKey in data)) return
    delete data[docKey]
    saveFetchFailures(data)
}
