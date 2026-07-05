import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { REPORT_KIND_LABELS } from '@/lib/results-calendar'
import { ResultsCalendarRow } from '@/components/results/ResultsCalendarRow'
import { ExpectedResultsSection } from '@/components/results/ResultsCalendarSections'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { cn, formatNewsDate } from '@/lib/utils'

interface MarketsResultsTableProps {
    results: ResultsCalendarEntry[]
    expected: ExpectedResultsEntry[]
    lastIssuerScan: string | null
    issuerCount: number
}

export function MarketsResultsTable({
    results,
    expected,
    lastIssuerScan,
    issuerCount,
}: MarketsResultsTableProps) {
    return (
        <div className="space-y-8 min-w-0">
            <section className="space-y-3" aria-labelledby="markets-recent-results">
                <header className="space-y-1">
                    <h2 id="markets-recent-results" className="text-lg font-semibold font-heading text-text-primary">
                        Recent results
                    </h2>
                    <p className="text-sm text-text-secondary">
                        Filed on SECNet · filing date shown · end-of-day disclosures, not live estimates.
                    </p>
                    {lastIssuerScan ? (
                        <p className="text-[11px] font-data text-text-tertiary tabular-nums">
                            Last issuer scan {lastIssuerScan.replace(/-/g, '.')} · {issuerCount} issuers in feed
                        </p>
                    ) : null}
                </header>

                {results.length ? (
                    <>
                        <div
                            className="hidden md:grid grid-cols-[5rem_minmax(0,1fr)_8rem_8rem_2.5rem] gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-text-tertiary border-b border-border"
                        >
                            <span>Ticker</span>
                            <span>Report</span>
                            <span>Period</span>
                            <span className="text-right">Filed</span>
                            <span />
                        </div>
                        <div className="space-y-1.5">
                            {results.map((entry) => (
                                <MarketsResultsDesktopRow key={`${entry.stockCode}-${entry.reportKind}-${entry.filedAt}`} entry={entry} />
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="text-sm text-text-tertiary py-8 text-center border border-dashed border-border rounded-xl">
                        No result filings in the current feed.
                    </p>
                )}
            </section>

            <ExpectedResultsSection expected={expected} limit={20} />

            <section className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-1.5">
                    <h3 className="text-sm font-semibold font-heading text-text-primary">Regulatory latest dates</h3>
                    <InfoPopover label="Regulatory latest dates">
                        Market-wide latest publication dates from MSE listing rules — not per-issuer schedules.
                    </InfoPopover>
                </div>
                <ul className="text-xs font-data text-text-tertiary space-y-1 tabular-nums px-1">
                    <li>Q1 P&L (31.03) · latest 30.04</li>
                    <li>H1 statements (30.06) · latest 31.07</li>
                    <li>9M P&L (30.09) · latest 31.10</li>
                    <li>FY audited · latest 31.05</li>
                </ul>
            </section>
        </div>
    )
}

function MarketsResultsDesktopRow({ entry }: { entry: ResultsCalendarEntry }) {
    return (
        <>
            <div className="md:hidden">
                <ResultsCalendarRow entry={entry} />
            </div>
            <div
                className={cn(
                    'hidden md:grid grid-cols-[5rem_minmax(0,1fr)_8rem_8rem_2.5rem] gap-3 items-center px-3 py-2.5 rounded-lg',
                    'bg-surface-secondary/50 hover:bg-surface-secondary transition-colors min-w-0'
                )}
            >
                <a href={`/stock/${entry.stockCode}`} className="font-data text-sm font-semibold text-text-primary tabular-nums hover:text-accent">
                    {entry.stockCode}
                </a>
                <div className="min-w-0">
                    <div className="text-xs font-data text-text-secondary tabular-nums">
                        {REPORT_KIND_LABELS[entry.reportKind]}
                    </div>
                    <div className="text-[11px] text-text-tertiary truncate">{entry.stockName}</div>
                </div>
                <span className="text-xs font-data text-text-tertiary tabular-nums">
                    {entry.periodLabel ?? '—'}
                </span>
                <span className="text-xs font-data text-text-secondary tabular-nums text-right">
                    {formatNewsDate(entry.filedAt)}
                </span>
                <a
                    href={entry.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-accent hover:underline text-right"
                    aria-label={`SECNet filing for ${entry.stockCode}`}
                >
                    →
                </a>
            </div>
        </>
    )
}
