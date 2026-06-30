#!/usr/bin/env node
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { spawnSync } from 'child_process'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envExample = path.join(root, '.env.example')
const envLocal = path.join(root, '.env.local')
const nodeModules = path.join(root, 'node_modules')

const checkOnly = process.argv.includes('--check')

const REQUIRED_VARS = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
]

const PLACEHOLDER_PATTERNS = [
    /^your-/i,
    /^YOUR_/,
    /your-project-ref/,
    /your-anon-key/i,
    /^replace-me/i,
    /^changeme/i,
]

function log(message = '') {
    process.stdout.write(`${message}\n`)
}

function fail(message) {
    process.stderr.write(`${message}\n`)
    process.exit(1)
}

function ensureDeps() {
    if (fs.existsSync(nodeModules)) return

    log('Installing dependencies...')
    const result = spawnSync('npm', ['install'], {
        cwd: root,
        stdio: 'inherit',
        shell: true,
    })

    if (result.status !== 0) {
        fail('npm install failed.')
    }
}

function ensureEnvFile() {
    if (fs.existsSync(envLocal)) return false

    if (!fs.existsSync(envExample)) {
        fail('Missing .env.example. Pull the latest code and try again.')
    }

    fs.copyFileSync(envExample, envLocal)
    log('Created .env.local from .env.example')
    return true
}

function parseEnvFile(filePath) {
    const vars = {}

    for (const line of fs.readFileSync(filePath, 'utf8').split('\n')) {
        const trimmed = line.trim()
        if (!trimmed || trimmed.startsWith('#')) continue

        const separator = trimmed.indexOf('=')
        if (separator === -1) continue

        const key = trimmed.slice(0, separator).trim()
        const value = trimmed.slice(separator + 1).trim()
        vars[key] = value
    }

    return vars
}

function isPlaceholder(value) {
    if (!value) return true
    return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))
}

function validateEnv(vars) {
    const missing = REQUIRED_VARS.filter((key) => !vars[key])
    const placeholders = REQUIRED_VARS.filter((key) => vars[key] && isPlaceholder(vars[key]))

    return {
        ok: missing.length === 0 && placeholders.length === 0,
        missing,
        placeholders,
    }
}

function printEnvHelp() {
    log('')
    log('Configure Supabase in .env.local before previewing locally:')
    log('  1. Open https://supabase.com/dashboard → your project → Settings → API')
    log('  2. Copy Project URL and anon public key into .env.local')
    log('  3. In Authentication → URL configuration, add redirect:')
    log('       http://localhost:3000/auth/callback')
    log('  4. Run the user tables migration once (SQL Editor):')
    log('       supabase/migrations/001_user_data.sql')
    log('')
}

function printSuccess() {
    log('')
    log('Local environment is ready.')
    log('  npm run dev      start the dev server')
    log('  npm run preview  setup check + dev server (recommended first run)')
    log('  Open http://localhost:3000')
    log('')
}

ensureDeps()
const createdEnv = ensureEnvFile()

if (!fs.existsSync(envLocal)) {
    fail('Missing .env.local. Run: npm run setup')
}

const validation = validateEnv(parseEnvFile(envLocal))

if (!validation.ok) {
    if (validation.missing.length > 0) {
        log(`Missing in .env.local: ${validation.missing.join(', ')}`)
    }
    if (validation.placeholders.length > 0) {
        log(`Replace placeholder values for: ${validation.placeholders.join(', ')}`)
    }
    printEnvHelp()

    if (checkOnly) {
        fail('Local preview is not configured yet.')
    }

    if (createdEnv) {
        log('Edit .env.local, then run: npm run preview')
        process.exit(0)
    }

    fail('Fix .env.local, then run: npm run preview')
}

if (checkOnly) {
    printSuccess()
    process.exit(0)
}

printSuccess()
