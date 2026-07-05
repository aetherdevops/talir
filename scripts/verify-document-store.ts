import { loadEnvLocal } from '../lib/load-env-local'
import { getSupabaseAdminOrNull } from '../lib/supabase/admin'

loadEnvLocal()

async function main() {
    const db = getSupabaseAdminOrNull()
    if (!db) {
        console.error('Supabase admin not configured')
        process.exit(1)
    }

    const { count: docCount } = await db
        .from('seinet_documents')
        .select('*', { count: 'exact', head: true })
    const { count: fieldCount } = await db
        .from('document_field_extractions')
        .select('*', { count: 'exact', head: true })

    const { data: byStatus } = await db
        .from('document_field_extractions')
        .select('parse_status')

    const statusCounts: Record<string, number> = {}
    for (const row of byStatus ?? []) {
        statusCounts[row.parse_status] = (statusCounts[row.parse_status] ?? 0) + 1
    }

    const { data: alk } = await db
        .from('seinet_documents')
        .select('document_id, filed_at, stock_code')
        .eq('stock_code', 'ALK')
        .order('filed_at', { ascending: false })
        .limit(3)

    console.log('seinet_documents:', docCount)
    console.log('document_field_extractions:', fieldCount)
    console.log('parse_status counts:', statusCounts)
    console.log('latest ALK docs:', alk)
}

main().catch((err) => {
    console.error(err)
    process.exit(1)
})
