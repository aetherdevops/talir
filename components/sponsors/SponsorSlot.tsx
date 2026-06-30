import Link from 'next/link'
import { cn } from '@/lib/utils'

export type SponsorPlacement = 'leaderboard' | 'sidebar' | 'in-feed' | 'mobile-in-flow'

const PLACEMENT_STYLES: Record<SponsorPlacement, { className: string; aspect: string; minHeight: number }> = {
    leaderboard: {
        className: 'w-full max-w-5xl mx-auto hidden md:block',
        aspect: '728 / 90',
        minHeight: 90,
    },
    sidebar: {
        className: 'w-full hidden lg:block',
        aspect: '300 / 250',
        minHeight: 250,
    },
    'in-feed': {
        className: 'w-full',
        aspect: '16 / 9',
        minHeight: 160,
    },
    'mobile-in-flow': {
        className: 'w-full md:hidden',
        aspect: '16 / 9',
        minHeight: 140,
    },
}

export interface SponsorContent {
    imageUrl: string
    href: string
    label?: string
}

interface SponsorSlotProps {
    placement: SponsorPlacement
    sponsor?: SponsorContent
    className?: string
}

export function SponsorSlot({ placement, sponsor, className }: SponsorSlotProps) {
    const style = PLACEMENT_STYLES[placement]

    if (!sponsor) {
        return (
            <div
                className={cn(style.className, className)}
                style={{ minHeight: style.minHeight }}
                aria-hidden
            />
        )
    }

    return (
        <aside className={cn(style.className, className)} aria-label="Sponsored">
            <div
                className="relative overflow-hidden rounded-xl border border-border bg-surface-secondary"
                style={{ aspectRatio: style.aspect, minHeight: style.minHeight }}
            >
                <span className="absolute top-2 left-2 z-10 text-[10px] uppercase tracking-wider text-text-tertiary bg-surface/80 px-2 py-0.5 rounded">
                    Спонзор
                </span>
                <Link href={sponsor.href} target="_blank" rel="noopener sponsored">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={sponsor.imageUrl}
                        alt={sponsor.label ?? 'Sponsor'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                    />
                </Link>
            </div>
        </aside>
    )
}
