import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const EN_PATH = join(process.cwd(), 'messages', 'en.json')
const MK_PATH = join(process.cwd(), 'messages', 'mk.json')

const PARITY_NAMESPACES = ['menu', 'create', 'watchlist', 'portfolio', 'alerts', 'index', 'chart'] as const

function collectKeyPaths(value: unknown, prefix = ''): string[] {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
            const path = prefix ? `${prefix}.${key}` : key
            if (child && typeof child === 'object' && !Array.isArray(child)) {
                return collectKeyPaths(child, path)
            }
            return [path]
        })
    }
    return []
}

describe('i18n key parity', () => {
    it('menu/create/watchlist/portfolio/alerts/index/chart keys match in en and mk', () => {
        const en = JSON.parse(readFileSync(EN_PATH, 'utf8')) as Record<string, unknown>
        const mk = JSON.parse(readFileSync(MK_PATH, 'utf8')) as Record<string, unknown>

        for (const ns of PARITY_NAMESPACES) {
            const enKeys = collectKeyPaths(en[ns], ns).sort()
            const mkKeys = collectKeyPaths(mk[ns], ns).sort()
            assert.deepEqual(
                mkKeys,
                enKeys,
                `Key mismatch in namespace "${ns}": en has ${enKeys.length}, mk has ${mkKeys.length}`
            )
        }
    })
})
