import Link from 'next/link'
import { MarketIndex } from '@/lib/types'
import { PreviewMarketCard } from '@/components/home/PreviewMarketCard'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { ChevronRight } from 'lucide-react'

const HERO_INDEX_CODES = ['MBI10', 'OMB'] as const

interface HomeIndexHeroProps {
    indices: MarketIndex[]
    asOfDate: string
}

export function HomeIndexHero({ indices, asOfDate }: HomeIndexHeroProps) {
    const heroIndices = HERO_INDEX_CODES.map((code) =>
        indices.find((idx) => idx.name === code)
    ).filter((idx): idx is MarketIndex => idx != null)

    return (
        <section className="space-y-2 min-w-0" aria-labelledby="home-indices-heading">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between min-w-0">
                <h2
                    id="home-indices-heading"
                    className="font-heading text-base font-bold text-text-primary tracking-tight"
                >
                    Indices
                </h2>
                <DataFreshnessLabel asOfDate={asOfDate} variant="compact" />
            </div>

            {heroIndices.length > 0 ? (
                <div className="grid grid-cols-2 gap-2 w-full min-w-0">
                    {heroIndices.map((idx) => (
                        <PreviewMarketCard
                            key={idx.name}
                            href={`/market/${idx.name}`}
                            label={idx.name}
                            valueKind="index"
                            chartSeries={(idx.chartSeries ?? []).slice(-30)}
                            latestPrice={idx.value}
                            changePercent={idx.changePercent}
                        />
                    ))}
                </div>
            ) : (
                <p className="text-sm text-text-tertiary py-4 text-center">No index data available</p>
            )}

            <Link
                href="/markets"
                className="flex items-center justify-center gap-1 min-h-[44px] text-xs font-semibold text-accent hover:text-accent/80 transition-colors"
            >
                All markets
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
        </section>
    )
}
