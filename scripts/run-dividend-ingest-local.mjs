#!/usr/bin/env node
/**
 * One-shot: apply migrations → force-OCR ingest ALL dividend calendars → regenerate derived_dividends.json
 * Requires .env.local:
 *   NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ACCESS_TOKEN
 *   TALIR_DOCUMENT_STORE=supabase
 *
 * Always uses TALIR_SCOPE=ALL (ignores ambient shell / .env TALIR_SCOPE).
 * For MBI10-only: npm run ingest:dividends with TALIR_SCOPE=MBI10.
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env.local')

function loadEnvFile(filePath) {
    if (!fs.existsSync(filePath)) return {}
    const vars = {}
    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue
        const i = trimmed.indexOf('=')
        if (i === -1) continue
        vars[trimmed.slice(0, i).trim()] = trimmed.slice(i + 1).trim()
    }
    return vars
}

function requireKeys(env) {
    const missing = []
    if (!env.NEXT_PUBLIC_SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL.includes('your-project')) {
        missing.push('NEXT_PUBLIC_SUPABASE_URL')
    }
    if (!env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE_KEY.includes('your-service-role')) {
        missing.push('SUPABASE_SERVICE_ROLE_KEY')
    }
    if (!env.SUPABASE_ACCESS_TOKEN || !env.SUPABASE_ACCESS_TOKEN.startsWith('sbp_')) {
        missing.push('SUPABASE_ACCESS_TOKEN')
    }
    if (env.TALIR_DOCUMENT_STORE !== 'supabase') {
        missing.push('TALIR_DOCUMENT_STORE=supabase')
    }
    if (missing.length) {
        console.error('Missing or invalid in .env.local:\n  ' + missing.join('\n  '))
        console.error('\nAdd keys from Supabase Dashboard → Project Settings → API (service role)')
        console.error('and Account → Access Tokens (sbp_...) for db:apply.')
        process.exit(1)
    }
}

function run(label, command, args, extraEnv = {}) {
    console.log(`\n=== ${label} ===\n`)
    const env = { ...process.env, ...extraEnv }
    const result = spawnSync(command, args, { cwd: root, env, stdio: 'inherit', shell: true })
    if (result.status !== 0) {
        console.error(`\n${label} failed (exit ${result.status})`)
        process.exit(result.status ?? 1)
    }
}

const fileEnv = { ...loadEnvFile(path.join(root, '.env.example')), ...loadEnvFile(envPath) }
const env = { ...fileEnv, ...process.env }
requireKeys(env)

run('Apply Supabase migrations', 'npm', ['run', 'db:apply'])

run('Ingest dividend documents (ALL + OCR + force)', 'npm', ['run', 'ingest:dividends'], {
    TALIR_DOCUMENT_STORE: 'supabase',
    TALIR_SCOPE: 'ALL',
    TALIR_OCR_DIVIDENDS: '1',
    TALIR_PARSE_FORCE: '1',
})

run('Generate dividends calendar (merge from Supabase)', 'npm', ['run', 'generate:dividends'], {
    TALIR_DOCUMENT_STORE: 'supabase',
    TALIR_PARSE_DIVIDENDS: '1',
    TALIR_OCR_DIVIDENDS: '1',
    TALIR_SCOPE: 'ALL',
})

console.log('\nDone. Check lib/data/derived_dividends.json and test /stock/KMB, /dividends.')
