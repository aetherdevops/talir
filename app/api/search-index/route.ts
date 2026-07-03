import { getSearchIndex } from '@/lib/data'

export const revalidate = 86400

export async function GET() {
    const items = getSearchIndex()
    return Response.json(
        { items },
        {
            headers: {
                'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
            },
        }
    )
}
