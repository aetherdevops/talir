
import { NewsItem } from "@/lib/types"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"
import { formatTimeAgo } from "@/lib/time"

interface NewsPreviewProps {
    news: NewsItem[]
}

export function NewsPreview({ news }: NewsPreviewProps) {
    if (!news || news.length === 0) return null

    return (
        <section className="space-y-4">
            <div className="flex items-center justify-between px-2">
                <h2 className="text-xl font-normal text-text-primary">Today's Financial News</h2>
                <Button variant="ghost" size="sm" asChild>
                    <Link href="/news" className="text-brand-text font-bold flex items-center gap-1">
                        View all <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </div>

            <div className="space-y-4">
                {news.map((item) => (
                    <a
                        key={item.id}
                        href={`${item.url || '#'}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block group"
                    >
                        <Card interactive className="rounded-2xl border-none shadow-sm hover:shadow-md bg-surface overflow-hidden transition-all duration-300 transform group-hover:-translate-y-1">
                            <CardContent className="p-0 flex h-32">
                                <div className="flex-1 p-5 flex flex-col justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-xs text-text-tertiary">
                                            <span className="font-bold text-text-secondary uppercase tracking-wider">{item.source}</span>
                                            <span>•</span>
                                            <span>{formatTimeAgo(item.publishedAt)}</span>
                                        </div>
                                        <h3 className="font-bold text-text-primary line-clamp-2 leading-tight group-hover:text-brand-600 transition-colors">
                                            {item.title}
                                        </h3>
                                    </div>
                                </div>
                                {item.imageUrl && (
                                    <div className="w-32 h-full relative overflow-hidden">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={item.imageUrl}
                                            alt=""
                                            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-l from-black/10 to-transparent"></div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </a>
                ))}
            </div>
        </section>
    )
}
