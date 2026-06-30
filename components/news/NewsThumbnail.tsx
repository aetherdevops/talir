import {
    BarChart3,
    Building2,
    Coins,
    FileText,
    Newspaper,
    type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { NewsCategory } from '@/lib/types'

const CATEGORY_CONFIG: Record<
    NewsCategory,
    { icon: LucideIcon; gradient: string; label: string }
> = {
    earnings: {
        icon: BarChart3,
        gradient: 'from-emerald-500/20 to-emerald-600/5',
        label: 'Earnings',
    },
    financials: {
        icon: FileText,
        gradient: 'from-cyan-500/20 to-cyan-600/5',
        label: 'Financials',
    },
    dividend: {
        icon: Coins,
        gradient: 'from-amber-500/20 to-amber-600/5',
        label: 'Dividend',
    },
    corporate: {
        icon: Building2,
        gradient: 'from-violet-500/20 to-violet-600/5',
        label: 'Corporate',
    },
    other: {
        icon: Newspaper,
        gradient: 'from-zinc-500/20 to-zinc-600/5',
        label: 'Market',
    },
}

interface NewsThumbnailProps {
    category: NewsCategory
    stockCode: string
    imageUrl?: string
    className?: string
    featured?: boolean
}

export function NewsThumbnail({
    category,
    stockCode,
    imageUrl,
    className,
    featured = false,
}: NewsThumbnailProps) {
    const config = CATEGORY_CONFIG[category]
    const Icon = config.icon
    const height = featured ? 'h-full min-h-[140px]' : 'h-full min-h-[100px]'

    if (imageUrl) {
        return (
            <div className={cn('relative overflow-hidden bg-surface-secondary', height, className)}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
        )
    }

    return (
        <div
            className={cn(
                'relative flex flex-col items-center justify-center bg-gradient-to-br p-4',
                config.gradient,
                height,
                className
            )}
        >
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider text-text-secondary bg-surface/80 px-2 py-0.5 rounded">
                {stockCode}
            </span>
            <Icon className="h-8 w-8 text-accent opacity-80" strokeWidth={1.5} aria-hidden />
            <span className="mt-2 text-[10px] font-semibold uppercase tracking-wide text-text-tertiary">
                {config.label}
            </span>
        </div>
    )
}
