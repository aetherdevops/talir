import type { CSSProperties } from 'react'
import type { DerivedSectorRollup } from '@/lib/data'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { cn } from '@/lib/utils'

interface HomeSectorStripProps {
    sectors: DerivedSectorRollup[]
}

const SECTOR_ROW_HEIGHT = 72

export function HomeSectorStrip({ sectors }: HomeSectorStripProps) {
    if (!sectors.length) return null

    return (
        <section
            className="space-y-2 min-w-0"
            aria-labelledby="home-sectors-heading"
        >
            <div className="min-w-0">
                <h2
                    id="home-sectors-heading"
                    className="font-heading text-base font-bold text-text-primary tracking-tight"
                >
                    MSE Sectors
                </h2>
                <p className="text-[11px] text-text-tertiary leading-snug mt-1">
                    Grouped by MSE listing sector, end-of-day.
                </p>
            </div>

            {/*
              Mobile: flex-wrap into ~2 rows (<768px) — no page-level horizontal scroll.
              md+: single horizontal row with wrap as needed.
            */}
            <div
                className={cn(
                    'flex flex-wrap gap-2 min-w-0',
                    'max-md:max-w-full'
                )}
            >
                {sectors.map((sector) => (
                    <div
                        key={sector.name}
                        className={cn(
                            'rounded-xl bg-surface-secondary px-3 py-2 min-w-0',
                            'flex flex-col justify-center',
                            'w-[calc(50%-0.25rem)] max-md:min-h-[var(--sector-row-h)]',
                            'md:w-auto md:min-w-[140px] md:flex-1 md:max-w-[180px]'
                        )}
                        style={{ '--sector-row-h': `${SECTOR_ROW_HEIGHT}px` } as CSSProperties}
                    >
                        <span className="text-xs font-semibold text-text-primary truncate block">
                            {sector.name}
                        </span>
                        <ChangeLabel change={sector.avgChangePct} className="text-xs mt-0.5" />
                        <p className="text-[10px] text-text-tertiary font-data mt-1 tabular-nums">
                            <span className="text-up">{sector.advancers} up</span>
                            {' · '}
                            <span className="text-down">{sector.decliners} down</span>
                            {' · '}
                            {sector.unchanged} flat
                        </p>
                    </div>
                ))}
            </div>
        </section>
    )
}
