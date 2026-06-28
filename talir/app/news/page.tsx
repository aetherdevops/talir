
import { NewsSection } from '@/components/common/NewsSection'
import { Metadata } from 'next'

export const metadata: Metadata = {
    title: 'News | Talir',
    description: 'Latest market news and analysis',
}

export default function NewsPage() {
    return (
        <div className="min-h-screen bg-background pb-20">
            <main className="max-w-7xl mx-auto px-4 py-8 animate-in fade-in duration-500">
                <div className="flex flex-col gap-8">
                    {/* Header */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-3xl font-normal text-text-primary tracking-tight">All News</h1>
                        <p className="text-text-secondary">Stay updated with the latest developments on the Macedonian Stock Exchange.</p>
                    </div>

                    {/* News Content */}
                    <NewsSection limit={20} title="" />
                </div>
            </main>
        </div>
    )
}
