#!/usr/bin/env node
/**
 * Push Supabase secrets from .env.local to GitHub Actions (repo secrets).
 * Requires: gh auth login (once), then npm run gh:secrets
 */
import { spawnSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env.local')

const SECRETS = ['NEXT_PUBLIC_SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']

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

function gh(args, input) {
    const result = spawnSync('gh', args, {
        cwd: root,
        input,
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
    })
    return result
}

function ensureGhAuth(env) {
    const status = gh(['auth', 'status'])
    if (status.status === 0) return

    const token = env.GITHUB_TOKEN || env.GH_TOKEN
    if (token && !token.includes('your-')) {
        const login = gh(['auth', 'login', '--with-token'], token)
        if (login.status === 0) return
        console.error('GITHUB_TOKEN auth failed:', login.stderr?.trim() || login.stdout?.trim())
        process.exit(1)
    }

    console.error(
        'Not logged in to GitHub. Either:\n' +
            '  1. Run: gh auth login\n' +
            '  2. Add GITHUB_TOKEN (repo admin PAT) to .env.local, then re-run\n' +
            'Then: npm run gh:secrets'
    )
    process.exit(1)
}

const env = { ...loadEnvFile(path.join(root, '.env.example')), ...loadEnvFile(envPath), ...process.env }
ensureGhAuth(env)
const missing = SECRETS.filter((key) => !env[key] || env[key].includes('your-'))
if (missing.length) {
    console.error(`Missing in .env.local: ${missing.join(', ')}`)
    process.exit(1)
}

for (const name of SECRETS) {
    const set = gh(['secret', 'set', name], env[name])
    if (set.status !== 0) {
        console.error(`Failed to set ${name}:`, set.stderr?.trim() || set.stdout?.trim())
        process.exit(set.status ?? 1)
    }
    console.log(`Set GitHub secret: ${name}`)
}

const list = gh(['secret', 'list'])
if (list.status === 0) {
    console.log('\nRepo secrets:')
    console.log(list.stdout.trim())
}

console.log('\nDone. Daily workflow can use Supabase ingest on the next run (or workflow_dispatch).')
