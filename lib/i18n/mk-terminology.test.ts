import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'

const MK_PATH = join(process.cwd(), 'messages', 'mk.json')

/** Tokens that must not appear in Macedonian UI copy (use terms.* instead). */
const BANNED_IN_MK = [
    /\bSECNet\b/i,
    /\bSEInet\b/i,
    /\bЕПС\b/,
    /\bDPS\b/i,
    /ex-датум/i,
    /ранг-лист/i,
    /\bEOD\b/i,
    /\bP&L\b/i,
]

function collectViolations(value: unknown, path: string): string[] {
    if (typeof value === 'string') {
        return BANNED_IN_MK.filter((re) => re.test(value)).map((re) => `${path}: matched ${re}`)
    }
    if (Array.isArray(value)) {
        return value.flatMap((item, index) => collectViolations(item, `${path}[${index}]`))
    }
    if (value && typeof value === 'object') {
        return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) =>
            collectViolations(child, path ? `${path}.${key}` : key)
        )
    }
    return []
}

describe('mk.json terminology', () => {
    it('avoids English acronyms and SECNet branding', () => {
        const raw = readFileSync(MK_PATH, 'utf8')
        const messages = JSON.parse(raw) as Record<string, unknown>
        const violations = collectViolations(messages, '')
        assert.deepEqual(violations, [])
    })
})
