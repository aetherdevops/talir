import issuerMetaData from '@/lib/data/issuer_meta.json'
import type { Locale } from '@/lib/i18n/config'
import { latinToMacedonianCyrillic } from '@/lib/latin-to-cyrillic'

type IssuerMetaEntry = {
    nameMk?: string
    marketCapThousandsMkd?: number
}

type IssuerMetaFile = {
    issuers?: Record<string, IssuerMetaEntry>
} & Record<string, IssuerMetaEntry | string | number | undefined>

function loadIssuerMetaMap(): Record<string, IssuerMetaEntry> {
    const file = issuerMetaData as IssuerMetaFile
    if (file.issuers && typeof file.issuers === 'object') {
        return file.issuers
    }
    const map: Record<string, IssuerMetaEntry> = {}
    for (const [key, value] of Object.entries(file)) {
        if (key === 'generatedAt' || key === 'count') continue
        if (value && typeof value === 'object') {
            map[key] = value as IssuerMetaEntry
        }
    }
    return map
}

const issuerMeta = loadIssuerMetaMap()

export function getIssuerMarketCapThousands(code: string): number | undefined {
    const value = issuerMeta[code]?.marketCapThousandsMkd
    return typeof value === 'number' && value > 0 ? value : undefined
}

export function getIssuerDisplayName(locale: Locale, code: string, latinName: string): string {
    if (locale === 'en') return latinName

    const fromMeta = issuerMeta[code]?.nameMk?.trim()
    if (fromMeta) return fromMeta

    return latinToMacedonianCyrillic(latinName)
}
