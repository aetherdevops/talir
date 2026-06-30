import { getAllStocks, buildSparklineMap } from '@/lib/data'

export const revalidate = 3600

export async function GET() {
    const stocks = await getAllStocks()
    const codes = stocks.map((s) => s.code)
    const sparklines = await buildSparklineMap(codes)

    return Response.json(sparklines, {
        headers: {
            'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
        },
    })
}
