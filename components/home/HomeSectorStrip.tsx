'use client'

import { useMemo, useState, type CSSProperties } from 'react'
import type { DerivedSectorRollup } from '@/lib/data'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { IssuerDisplayName } from '@/components/common/IssuerDisplayName'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useInstruments } from '@/components/providers/InstrumentsProvider'
import { useLocale } from '@/components/providers/LocaleProvider'
import { translateSector } from '@/lib/sectors'
import { cn, formatInteger } from '@/lib/utils'

interface HomeSectorStripProps {
    sectors: DerivedSectorRollup[]
}

const SECTOR_ROW_HEIGHT = 72

export function HomeSectorStrip({ sectors }: HomeSectorStripProps) {
    const { t } = useLocale()
    const instruments = useInstruments()
    const [selectedSector, setSelectedSector] = useState<string | null>(null)

    const sectorCompanies = useMemo(() => {
        if (!selectedSector) return []
        return instruments
            .filter((stock) => stock.type !== 'Index' && stock.sector === selectedSector)
            .sort((a, b) => {
                const capA = a.marketCapThousandsMkd ?? 0
                const capB = b.marketCapThousandsMkd ?? 0
                if (capB !== capA) return capB - capA
                return b.turnover - a.turnover
            })
    }, [instruments, selectedSector])

    if (!sectors.length) return null

    return (
        <section className="space-y-2 min-w-0" aria-labelledby="home-sectors-sr-only">
            <h2 id="home-sectors-sr-only" className="sr-only">
                {t('home.sectorsSrOnly')}
            </h2>
            <p className="text-[11px] text-text-tertiary leading-snug">
                {t('home.sectorsHint')}
            </p>

            <div className="flex flex-wrap gap-2 min-w-0 max-md:max-w-full">
                {sectors.map((sector) => {
                    const isSelected = selectedSector === sector.name
                    return (
                        <button
                            key={sector.name}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() =>
                                setSelectedSector((current) =>
                                    current === sector.name ? null : sector.name
                                )
                            }
                            className={cn(
                                'rounded-xl px-3 py-2 min-w-0 text-left transition-colors',
                                'flex flex-col justify-center',
                                'w-[calc(50%-0.25rem)] max-md:min-h-[var(--sector-row-h)]',
                                'md:w-auto md:min-w-[140px] md:flex-1 md:max-w-[180px]',
                                isSelected
                                    ? 'bg-surface border border-accent/40 ring-1 ring-accent/20'
                                    : 'bg-surface-secondary hover:bg-surface-secondary/80 border border-transparent'
                            )}
                            style={{ '--sector-row-h': `${SECTOR_ROW_HEIGHT}px` } as CSSProperties}
                        >
                            <span className="text-xs font-semibold text-text-primary truncate block">
                                {translateSector(sector.name, t)}
                            </span>
                            <ChangeLabel change={sector.avgChangePct} className="text-xs mt-0.5" />
                            <p className="text-[10px] text-text-tertiary font-data mt-1 tabular-nums">
                                <span className="text-up">{t('markets.breadthUp', { count: sector.advancers })}</span>
                                {' · '}
                                <span className="text-down">{t('markets.breadthDown', { count: sector.decliners })}</span>
                                {' · '}
                                {t('markets.breadthFlat', { count: sector.unchanged })}
                            </p>
                        </button>
                    )
                })}
            </div>

            {selectedSector ? (
                <div className="rounded-xl border border-border bg-surface p-3 md:p-4 space-y-3">
                    <div className="min-w-0">
                        <h3 className="text-sm font-semibold text-text-primary">
                            {translateSector(selectedSector, t)}
                        </h3>
                        <p className="text-[11px] text-text-tertiary mt-0.5">{t('home.sectorCompaniesHint')}</p>
                    </div>

                    {sectorCompanies.length ? (
                        <ul className="divide-y divide-border rounded-lg border border-border overflow-hidden">
                            {sectorCompanies.map((stock) => (
                                <li key={stock.code}>
                                    <LocaleLink
                                        href={`/stock/${stock.code}`}
                                        className="flex items-center gap-3 px-3 py-2.5 min-h-[44px] hover:bg-surface-secondary/70 transition-colors"
                                    >
                                        <span className="font-data text-[10px] font-bold text-text-secondary bg-surface-secondary rounded-md w-10 h-7 inline-flex items-center justify-center shrink-0">
                                            {stock.code}
                                        </span>
                                        <div className="flex flex-col min-w-0 flex-1 gap-0.5">
                                            <IssuerDisplayName
                                                code={stock.code}
                                                name={stock.name}
                                                className="text-sm font-medium text-text-primary truncate leading-tight"
                                            />
                                            {stock.marketCapThousandsMkd != null ? (
                                                <span className="text-[10px] text-text-tertiary font-data tabular-nums">
                                                    {t('home.sectorMarketCap')}{' '}
                                                    {formatInteger(stock.marketCapThousandsMkd)} 000 {t('common.den')}
                                                </span>
                                            ) : null}
                                        </div>
                                        <ChangeLabel change={stock.changePercent} className="text-xs shrink-0" />
                                    </LocaleLink>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-sm text-text-secondary">{t('home.noData')}</p>
                    )}
                </div>
            ) : (
                <p className="text-[11px] text-text-tertiary">{t('home.sectorSelectHint')}</p>
            )}
        </section>
    )
}
