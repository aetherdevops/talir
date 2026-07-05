import type { ExpectedResultsEntry, ResultsCalendarEntry } from '@/lib/results-calendar'
import { ResultsCalendarRow } from '@/components/results/ResultsCalendarRow'
import { ExpectedResultsSection } from '@/components/results/ResultsCalendarSections'
import { InfoPopover } from '@/components/ui/InfoPopover'

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
        <div className="space-y-6 min-w-0">
            <section className="space-y-1.5 min-w-0" aria-labelledby="markets-recent-results">
                <header className="space-y-1 min-w-0">
                    <h2 id="markets-recent-results" className="text-lg font-semibold font-heading text-text-primary">
                        Recent results
                    </h2>
                    <p className="text-xs text-text-tertiary font-data">
                        Filed on SECNet · not live estimates
                    </p>
                    {lastIssuerScan ? (
                        <p className="text-[10px] font-data text-text-tertiary tabular-nums">
                            Last issuer scan {lastIssuerScan.replace(/-/g, '.')} · {issuerCount} issuers in feed
                        </p>
                    ) : null}
                </header>

                {results.length ? (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {results.map((entry) => (
                            <ResultsCalendarRow
                                key={`${entry.stockCode}-${entry.reportKind}-${entry.filedAt}`}
                                entry={entry}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary py-6 text-center border border-dashed border-border rounded-xl">
                        No result filings in the current feed.
                    </p>
                )}
            </section>

            <ExpectedResultsSection expected={expected} limit={20} includeRegulatory />

            <section className="space-y-2 pt-2 border-t border-border min-w-0">
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
