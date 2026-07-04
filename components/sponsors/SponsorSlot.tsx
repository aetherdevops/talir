import Link from 'next/link'
import { cn } from '@/lib/utils'
import { TalirMark } from '@/components/common/TalirMark'

/**
 * Talir sponsor inventory (IAB standard — exact px, never viewport-scaled):
 * - leaderboard:   728×90  — desktop strip (md+, ≥768px)
 * - mobile-banner: 320×100 — mobile strip (<768px; hidden below 360px viewport)
 * - rectangle:     300×250 — in-feed / rail mid-scroll
 */
export type SponsorPlacement = 'leaderboard' | 'mobile-banner' | 'rectangle'

const PLACEMENT_SIZES: Record<
    SponsorPlacement,
    { width: number; height: number; wrapperClass: string; markSize: number; compact?: boolean }
> = {
    leaderboard: {
        width: 728,
        height: 90,
        wrapperClass: 'hidden md:flex justify-center',
        markSize: 32,
        compact: true,
    },
    'mobile-banner': {
        width: 320,
        height: 100,
        wrapperClass: 'hidden min-[360px]:flex md:hidden justify-center',
        markSize: 28,
        compact: true,
    },
    rectangle: {
        width: 300,
        height: 250,
        wrapperClass: 'flex justify-center',
        markSize: 36,
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

function FixedAdFrame({
    width,
    height,
    markSize,
    compact,
    className,
}: {
    width: number
    height: number
    markSize: number
    compact?: boolean
    className?: string
}) {
    return (
        <div
            className={cn(
                'relative shrink-0 overflow-hidden rounded-xl border border-border/80 bg-gradient-to-br from-talir-navy/5 to-accent-muted',
                'dark:from-talir-navy dark:to-talir-navy-2 dark:border-border',
                className
            )}
            style={{ width, height }}
        >
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 p-2 text-center">
                <TalirMark
                    size={markSize}
                    className="[--disc:var(--talir-gold)] [--ink:var(--talir-navy)] dark:[--ink:var(--talir-navy-deep)]"
                />
                <p className="font-serif text-xs font-semibold text-text-primary">Talir.mk</p>
                {!compact && (
                    <p className="font-data text-[10px] uppercase tracking-widest text-text-tertiary">
                        Macedonian markets, end-of-day
                    </p>
                )}
            </div>
        </div>
    )
}

export function SponsorSlot({ placement, sponsor, className }: SponsorSlotProps) {
    const spec = PLACEMENT_SIZES[placement]
    const { width, height, wrapperClass, markSize, compact } = spec

    if (!sponsor) {
        return (
            <aside
                className={cn(wrapperClass, className)}
                aria-label="Sponsor placement"
            >
                <FixedAdFrame width={width} height={height} markSize={markSize} compact={compact} />
            </aside>
        )
    }

    return (
        <aside className={cn(wrapperClass, className)} aria-label="Sponsored">
            <div
                className="relative shrink-0 overflow-hidden rounded-xl border border-border bg-surface-secondary ring-1 ring-accent/10"
                style={{ width, height }}
            >
                <span className="absolute top-2 left-2 z-10 font-data text-[10px] uppercase tracking-wider text-text-tertiary bg-surface/90 px-2 py-0.5 rounded border border-border/60">
                    Спонзор / Sponsored
                </span>
                <Link href={sponsor.href} target="_blank" rel="noopener sponsored" className="block h-full w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={sponsor.imageUrl}
                        alt={sponsor.label ?? 'Sponsor'}
                        className="h-full w-full object-cover"
                        loading="lazy"
                        width={width}
                        height={height}
                    />
                </Link>
            </div>
        </aside>
    )
}
