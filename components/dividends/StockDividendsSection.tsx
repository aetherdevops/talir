import type { DividendCalendarEntry } from '@/lib/dividends'
import { DividendRow } from '@/components/dividends/DividendRow'
import { DividendHistoryChart } from '@/components/dividends/DividendHistoryChart'

interface StockDividendsSectionProps {
    dividends: DividendCalendarEntry[]
}

export function StockDividendsSection({ dividends }: StockDividendsSectionProps) {
    if (!dividends.length) return null

    const sorted = [...dividends].sort((a, b) => b.filedAt.localeCompare(a.filedAt))
    const showChart = sorted.filter((e) => e.parseStatus === 'parsed' && e.grossPerShare !== null).length >= 2

    return (
        <section className="space-y-3" aria-labelledby="stock-dividends-heading">
            <div className="space-y-1">
                <h3 id="stock-dividends-heading" className="text-sm font-semibold font-heading text-text-primary">
                    Dividend calendars
                </h3>
                <p className="text-[11px] font-data text-text-tertiary">
                    Filed on SECNet · official disclosures only · not a forecast
                </p>
            </div>

            {showChart && <DividendHistoryChart entries={sorted} />}

            <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                {sorted.slice(0, 8).map((entry) => (
                    <DividendRow key={`${entry.filedAt}-${entry.url}`} entry={entry} />
                ))}
            </div>
        </section>
    )
}
