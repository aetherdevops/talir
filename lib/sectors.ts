/** MSE listing sectors (English keys from issuers scrape). */

export const MSE_SECTORS = [
    'Agriculture',
    'Banking',
    'Catering',
    'Construction',
    'Industry',
    'Services',
    'Trade',
] as const

export type MseSector = (typeof MSE_SECTORS)[number]

const SECTOR_MESSAGE_KEYS: Record<MseSector, string> = {
    Agriculture: 'sectors.agriculture',
    Banking: 'sectors.banking',
    Catering: 'sectors.catering',
    Construction: 'sectors.construction',
    Industry: 'sectors.industry',
    Services: 'sectors.services',
    Trade: 'sectors.trade',
}

export function sectorMessageKey(sector: string): string | null {
    if (sector in SECTOR_MESSAGE_KEYS) {
        return SECTOR_MESSAGE_KEYS[sector as MseSector]
    }
    return null
}

export function translateSector(
    sector: string,
    t: (key: string, vars?: Record<string, string | number>) => string
): string {
    const key = sectorMessageKey(sector)
    return key ? t(key) : sector
}
