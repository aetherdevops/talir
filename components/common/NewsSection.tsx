"use client"

import { Card, CardHeader, CardContent } from '@/components/ui/Card'
import { ExternalLink, Calendar } from 'lucide-react'

interface NewsItem {
    id: string
    title: string
    source: string
    date: string
    url: string
    imageUrl?: string
}

const MOCK_NEWS: NewsItem[] = [
    {
        id: '1',
        title: 'MSE Index Shows Strong Growth in Q4',
        source: 'Macedonian Stock Exchange',
        date: '2 hours ago',
        url: '#',
        imageUrl: 'https://images.unsplash.com/photo-1611974765270-ca1258634369?w=800&auto=format&fit=crop&q=60'
    },
    {
        id: '2',
        title: 'Banking Sector Leads Market Rally',
        source: 'Kapital',
        date: '5 hours ago',
        url: '#',
        imageUrl: 'https://images.unsplash.com/photo-1565514020176-dbf2238cd872?w=800&auto=format&fit=crop&q=60'
    },
    {
        id: '3',
        title: 'New Dividend Announcements for Major Holdings',
        source: 'Faktor',
        date: '1 day ago',
        url: '#'
    },
    {
        id: '4',
        title: 'Annual Reports Analysis: Winners and Losers',
        source: 'MSE Stats',
        date: '2 days ago',
        url: '#'
    },
    {
        id: '5',
        title: 'Economic Forecast 2026: Impact on Local Stocks',
        source: 'Finance Today',
        date: '3 days ago',
        url: '#'
    }
]

interface NewsSectionProps {
    stockCode?: string // If provided, filter or show specific news (mock for now)
    limit?: number
    title?: string
}

export function NewsSection({ stockCode, limit = 5, title = "In the news" }: NewsSectionProps) {
    // In a real app, fetch news based on stockCode
    const displayNews = MOCK_NEWS.slice(0, limit)

    return (
        <Card className="w-full border-none shadow-none bg-transparent lg:bg-surface lg:shadow-card lg:border lg:border-border">
            <CardHeader className="px-0 pt-0 lg:px-6 lg:pt-6 border-none pb-2">
                <h2 className="text-lg font-bold text-text-primary">{title}</h2>
            </CardHeader>
            <CardContent className="px-0 lg:px-6 pb-0 lg:pb-6 space-y-4">
                {displayNews.map(news => (
                    <a
                        key={news.id}
                        href={news.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <div className="rounded-2xl border border-border/50 shadow-sm hover:shadow-md bg-surface overflow-hidden transition-all duration-300 transform group-hover:-translate-y-1">
                            <div className="flex h-32">
                                <div className="flex-1 p-5 flex flex-col justify-between min-w-0">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                            <span className="font-bold text-text-secondary uppercase tracking-wider">{news.source}</span>
                                            <span>•</span>
                                            <span>{news.date}</span>
                                        </div>
                                        <h3 className="font-bold text-text-primary line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">
                                            {news.title}
                                        </h3>
                                    </div>
                                </div>
                                {news.imageUrl && (
                                    <div className="w-32 h-full relative overflow-hidden flex-shrink-0 bg-surface-tertiary">
                                        <img
                                            src={news.imageUrl}
                                            alt=""
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent"></div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </a>
                ))}
            </CardContent>
        </Card>
    )
}
