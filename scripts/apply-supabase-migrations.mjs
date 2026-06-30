#!/usr/bin/env node
/**
 * Apply Talir SQL migrations to remote Supabase via Management API.
 * Requires SUPABASE_ACCESS_TOKEN in .env.local (Dashboard → Account → Access Tokens).
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const envPath = path.join(root, '.env.local')
const PROJECT_REF = 'otzjrcjflfhsbgehaplp'

const MIGRATIONS = [
    '001_user_data.sql',
    '002_user_preferences.sql',
    '003_delete_user_account.sql',
]

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

async function runQuery(token, sql) {
    const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: sql }),
    })

    const text = await res.text()
    let body
    try {
        body = JSON.parse(text)
    } catch {
        body = text
    }

    if (!res.ok) {
        throw new Error(typeof body === 'string' ? body : JSON.stringify(body))
    }
    return body
}

async function main() {
    const env = {
        ...loadEnvFile(path.join(root, '.env.example')),
        ...loadEnvFile(envPath),
        ...process.env,
    }

    const token = env.SUPABASE_ACCESS_TOKEN
    if (!token) {
        console.error(
            'Missing SUPABASE_ACCESS_TOKEN.\n' +
            '1. Open https://supabase.com/dashboard/account/tokens\n' +
            '2. Generate a token\n' +
            '3. Add to .env.local: SUPABASE_ACCESS_TOKEN=sbp_...\n' +
            '4. Re-run: npm run db:apply'
        )
        process.exit(1)
    }

    for (const file of MIGRATIONS) {
        const filePath = path.join(root, 'supabase', 'migrations', file)
        const sql = fs.readFileSync(filePath, 'utf8')
        console.log(`Applying ${file}...`)
        try {
            await runQuery(token, sql)
            console.log(`  OK`)
        } catch (error) {
            const msg = String(error.message || error)
            if (msg.includes('already exists') || msg.includes('duplicate')) {
                console.log(`  Skipped (already applied)`)
                continue
            }
            console.error(`  FAILED: ${msg}`)
            process.exit(1)
        }
    }

    console.log('\nVerifying profiles table...')
    const check = await runQuery(
        token,
        `select column_name from information_schema.columns
         where table_schema = 'public' and table_name = 'profiles'
         order by column_name;`
    )
    console.log('profiles columns:', check)

    console.log('\nAll migrations applied successfully.')
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
