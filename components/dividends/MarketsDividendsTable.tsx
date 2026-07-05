import Link from 'next/link'
import type { DividendCalendarEntry } from '@/lib/dividends'
import { DividendRow } from '@/components/dividends/DividendRow'
import { InfoPopover } from '@/components/ui/InfoPopover'

interface MarketsDividendsTableProps {
    recent: DividendCalendarEntry[]
    upcoming: DividendCalendarEntry[]
    lastIssuerScan: string | null
    issuerCount: number
}

export function MarketsDividendsTable({
    recent,
    upcoming,
    lastIssuerScan,
    issuerCount,
}: MarketsDividendsTableProps) {
    return (
        <div className="space-y-6 min-w-0">
            <section className="space-y-1.5 min-w-0" aria-labelledby="markets-dividends-recent">
                <header className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 min-w-0">
                        <h2 id="markets-dividends-recent" className="text-lg font-semibold font-heading text-text-primary">
                            Dividend calendars
                        </h2>
                        <Link href="/dividends" className="text-xs font-medium text-accent hover:underline shrink-0">
                            Dividend hub
                        </Link>
                    </div>
                    <p className="text-xs text-text-tertiary font-data">
                        From SECNet · official calendars filed after shareholders&apos; assembly approval · not a forecast
                    </p>
                    {lastIssuerScan ? (
                        <p className="text-[10px] font-data text-text-tertiary tabular-nums">
                            Last issuer scan {lastIssuerScan.replace(/-/g, '.')} · {issuerCount} issuers in feed
                        </p>
                    ) : null}
                </header>

                {recent.length ? (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {recent.map((entry) => (
                            <DividendRow key={`${entry.stockCode}-${entry.filedAt}-${entry.url}`} entry={entry} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary py-6 text-center border border-dashed border-border rounded-xl">
                        No dividend calendars in the current feed.
                    </p>
                )}
            </section>

            {upcoming.length > 0 && (
                <section className="space-y-1.5 min-w-0" aria-labelledby="markets-dividends-upcoming">
                    <h3 id="markets-dividends-upcoming" className="text-sm font-semibold font-heading text-text-primary">
                        Upcoming ex-dates
                    </h3>
                    <p className="text-xs text-text-tertiary font-data">
                        Parsed from filed dividend calendars only
                    </p>
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {upcoming.map((entry) => (
                            <DividendRow key={`up-${entry.stockCode}-${entry.exDate}`} entry={entry} />
                        ))}
                    </div>
                </section>
            )}

            <section className="space-y-2 pt-2 border-t border-border min-w-0">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold font-heading text-text-primary">Regulatory note</h3>
                    <InfoPopover label="Dividend calendars">
                        Under MSE listing rules, issuers publish a dividend calendar after the shareholders&apos;
                        assembly approves a distribution. Talir shows only filed SECNet disclosures — no projections.
                    </InfoPopover>
                </div>
                <p className="text-xs font-data text-text-tertiary px-1">
                    Dividends appear only after official approval and calendar filing on SECNet.
                </p>
            </section>
        </div>
    )
}
