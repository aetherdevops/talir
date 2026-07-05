import Link from 'next/link'
import { MarketIndex } from '@/lib/types'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { formatIndexLevelCompact } from '@/lib/utils'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const INDEX_CODES = ['MBI10', 'OMB'] as const

interface HomeIndexStripProps {
    indices: MarketIndex[]
    asOfDate: string
    className?: string
}

export function HomeIndexStrip({ indices, asOfDate, className }: HomeIndexStripProps) {
    const rows = INDEX_CODES.map((code) =>
        indices.find((idx) => idx.name === code)
    ).filter((idx): idx is MarketIndex => idx != null)

    if (rows.length === 0) {
        return (
            <section className={cn('min-w-0', className)} aria-labelledby="home-indices-heading">
                <h2
                    id="home-indices-heading"
                    className="font-heading text-sm font-bold text-text-primary tracking-tight mb-2"
                >
                    Indices
                </h2>
                <DataFreshnessLabel asOfDate={asOfDate} className="mb-2" />
                <p className="text-sm text-text-tertiary py-2 text-center">No index data available</p>
            </section>
        )
    }

    return (
        <section className={cn('min-w-0', className)} aria-labelledby="home-indices-heading">
            <h2
                id="home-indices-heading"
                className="font-heading text-sm font-bold text-text-primary tracking-tight mb-2"
            >
                Indices
            </h2>
            <DataFreshnessLabel asOfDate={asOfDate} className="mb-2" />
            <div className="rounded-xl border border-border/60 bg-surface-secondary/30 divide-y divide-border/60 min-w-0">
                {rows.map((idx) => (
                    <Link
                        key={idx.name}
                        href={`/market/${idx.name}`}
                        className="flex items-center justify-between gap-2 px-3 py-2.5 min-h-[44px] min-w-0 hover:bg-surface-secondary/60 transition-colors"
                    >
                        <span className="font-data text-xs font-semibold text-text-primary shrink-0">
                            {idx.name}
                        </span>
                        <div className="flex items-center gap-2 min-w-0 justify-end">
                            <span className="font-data text-sm font-semibold text-text-primary tabular-nums truncate">
                                {formatIndexLevelCompact(idx.value)}
                            </span>
                            <ChangeLabel change={idx.changePercent} className="text-xs shrink-0" />
                        </div>
                    </Link>
                ))}
            </div>
            <Link
                href="/markets"
                className="flex items-center justify-center gap-1 min-h-[44px] text-xs font-semibold text-accent hover:text-accent/80 transition-colors mt-1"
            >
                All markets
                <ChevronRight className="h-3.5 w-3.5" aria-hidden />
            </Link>
        </section>
    )
}
