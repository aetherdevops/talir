import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TalirMark } from '@/components/common/TalirMark'

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

function HouseAdFrame({ minHeight, aspect, className }: { minHeight: number; aspect: string; className?: string }) {
    return (
        <div
            className={cn(
                'relative overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-talir-navy/5 to-accent-muted',
                'dark:from-talir-navy dark:to-talir-navy-2 dark:border-border',
                className
            )}
            style={{ aspectRatio: aspect, minHeight }}
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
                <TalirMark
                    size={36}
                    className="[--disc:var(--talir-gold)] [--ink:var(--talir-navy)] dark:[--ink:var(--talir-navy-deep)]"
                />
                <p className="font-serif text-sm font-semibold text-text-primary">Talir.mk</p>
                <p className="font-data text-[10px] uppercase tracking-widest text-text-tertiary">
                    Macedonian markets, end-of-day
                </p>
            </div>
        </div>
    )
}

export function SponsorSlot({ placement, sponsor, className }: SponsorSlotProps) {
    const style = PLACEMENT_STYLES[placement]

    if (!sponsor) {
        return (
            <aside className={cn(style.className, className)} aria-label="Sponsor placement">
                <HouseAdFrame minHeight={style.minHeight} aspect={style.aspect} />
            </aside>
        )
    }

    return (
        <aside className={cn(style.className, className)} aria-label="Sponsored">
            <div
                className="relative overflow-hidden rounded-xl border border-border bg-surface-secondary ring-1 ring-accent/10"
                style={{ aspectRatio: style.aspect, minHeight: style.minHeight }}
            >
                <span className="absolute top-2 left-2 z-10 font-data text-[10px] uppercase tracking-wider text-text-tertiary bg-surface/90 px-2 py-0.5 rounded border border-border/60">
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
