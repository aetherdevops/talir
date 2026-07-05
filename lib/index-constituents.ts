import fs from 'fs'
import path from 'path'

export type IngestScope = 'MBI10' | 'ALL'

const MBI10_PATH = path.join(process.cwd(), 'lib', 'data', 'mbi10_constituents.json')

export interface Mbi10ConstituentsFile {
    asOfDate: string
    codes: string[]
    source?: string
}

/** Known MBI10 tickers (fallback if scrape file missing). As of MSE revision 15.06.2026. */
export const MBI10_FALLBACK_CODES = [
    'ALK',
    'STB',
    'GRNT',
    'KMB',
    'MPT',
    'TTK',
    'TEL',
    'UNI',
    'TNB',
    'REPL',
] as const

export function loadMbi10ConstituentsFile(): Mbi10ConstituentsFile | null {
    if (!fs.existsSync(MBI10_PATH)) return null
    try {
        return JSON.parse(fs.readFileSync(MBI10_PATH, 'utf8')) as Mbi10ConstituentsFile
    } catch {
        return null
    }
}

export function getMbi10Codes(): string[] {
    const file = loadMbi10ConstituentsFile()
    if (file?.codes?.length) return [...file.codes]
    return [...MBI10_FALLBACK_CODES]
}

export function resolveIngestScope(): IngestScope {
    const raw = process.env.TALIR_SCOPE?.trim().toUpperCase()
    if (raw === 'ALL') return 'ALL'
    return 'MBI10'
}

export function isInScope(stockCode: string, scope: IngestScope = resolveIngestScope()): boolean {
    if (scope === 'ALL') return true
    const codes = new Set(getMbi10Codes().map((c) => c.toUpperCase()))
    return codes.has(stockCode.toUpperCase())
}
