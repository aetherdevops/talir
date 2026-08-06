'use client'

import { SectorStrip } from '@/components/markets/SectorStrip'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { DerivedSectorRollup } from '@/lib/market-derived-types'

interface MacroMarketSectorsProps {
    sectors: DerivedSectorRollup[]
}

export function MacroMarketSectors({ sectors }: MacroMarketSectorsProps) {
    const { t } = useLocale()

    if (!sectors.length) return null

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

            <SectorStrip sectors={sectors} />
        </section>
    )
}
