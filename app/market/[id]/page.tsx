
import { Suspense } from 'react'
import { getIndexDetails, getLatestNews } from '@/lib/data'
import { IndexClient } from './Client'
import { notFound } from 'next/navigation'

// Force dynamic rendering to ensure fresh data
export const dynamic = 'force-dynamic'

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function IndexPage({ params }: PageProps) {
    const { id } = await params
    const [indexData, news] = await Promise.all([
        getIndexDetails(id),
        getLatestNews(10) // Fetch broader news
    ])

    if (!indexData) {
        notFound()
    }

    return (
        <Suspense fallback={<div className="p-10 text-center animate-pulse">Loading Index Data...</div>}>
            <IndexClient index={indexData} news={news} />
        </Suspense>
    )
}
