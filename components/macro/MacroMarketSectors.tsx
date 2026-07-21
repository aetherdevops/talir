'use client'

import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { DerivedSectorRollup } from '@/lib/market-derived-types'
import { translateSector } from '@/lib/sectors'
import { cn, formatInteger } from '@/lib/utils'

interface MacroMarketSectorsProps {
    sectors: DerivedSectorRollup[]
}

export function MacroMarketSectors({ sectors }: MacroMarketSectorsProps) {
    const { t } = useLocale()

    if (!sectors.length) return null

    const sorted = [...sectors].sort((a, b) => b.avgChangePct - a.avgChangePct)

    return (
        <section className="space-y-3 min-w-0" aria-labelledby="macro-market-sectors">
            <div className="space-y-1">
                <h2
                    id="macro-market-sectors"
                    className="text-lg font-heading font-semibold text-text-primary tracking-tight"
                >
                    {t('macro.marketSectors')}
                </h2>
                <p className="text-sm text-text-secondary">{t('macro.marketSectorsSubtitle')}</p>
                <p className="text-[11px] font-data text-text-tertiary">{t('macro.marketSectorsSource')}</p>
            </div>

            <div className="rounded-xl border border-border bg-surface overflow-hidden">
                <ul className="divide-y divide-border">
                    {sorted.map((sector) => (
                        <li
                            key={sector.name}
                            className="flex items-center gap-3 px-4 py-3 min-h-[52px]"
                        >
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-sans text-text-primary truncate">
                                    {translateSector(sector.name, t)}
                                </p>
                                <p className="text-[10px] font-data text-text-tertiary mt-0.5">
                                    {t('macro.sectorBreadth', {
                                        adv: formatInteger(sector.advancers),
                                        dec: formatInteger(sector.decliners),
                                        n: formatInteger(sector.count),
                                    })}
                                </p>
                            </div>
                            <ChangeLabel
                                change={sector.avgChangePct}
                                className={cn('text-sm shrink-0')}
                            />
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    )
}
