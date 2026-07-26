'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/components/ui/Button'
import type { CoverageCell, CoverageCellKind, DividendCoverageReport } from '@/lib/dividend-coverage'

const GAP_KINDS: CoverageCellKind[] = [
    'link_only',
    'mse_only',
    'no_document',
    'partial_dps_only',
]

export function DividendCoveragePanel({
    report,
    onLoadGap,
}: {
    report: DividendCoverageReport | null
    onLoadGap: (cell: CoverageCell) => void
}) {
    const [gapsOnly, setGapsOnly] = useState(true)
    const [filterCode, setFilterCode] = useState('')

    const rows = useMemo(() => {
        if (!report) return []
        let cells = gapsOnly ? report.gaps : report.cells
        const code = filterCode.trim().toUpperCase()
        if (code) cells = cells.filter((c) => c.stockCode.includes(code))
        return cells.slice(0, 200)
    }, [report, gapsOnly, filterCode])

    if (!report) {
        return (
            <section className="rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2
                    className="text-xl font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--talir-serif)', letterSpacing: '-0.015em' }}
                >
                    Coverage
                </h2>
                <p className="mt-2 text-sm text-[var(--text-muted)]">
                    Run <code className="font-[family-name:var(--talir-mono)]">npm run report:dividends</code>{' '}
                    to generate <code className="font-[family-name:var(--talir-mono)]">derived_dividend_coverage.json</code>.
                </p>
            </section>
        )
    }

    const s = report.summary

    return (
        <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <header className="space-y-2">
                <h2
                    className="text-xl font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--talir-serif)', letterSpacing: '-0.015em' }}
                >
                    Coverage matrix
                </h2>
                <p className="font-[family-name:var(--talir-mono)] text-xs tabular-nums text-[var(--text-muted)]">
                    parser {report.parserVersion} · cells {s.totalCells} · gaps {report.gaps.length} ·
                    parsed {s.parsed} · partial {s.partial} · mse_only {s.mse_only} · link_only{' '}
                    {s.link_only}
                </p>
            </header>

            <div className="flex flex-wrap items-center gap-3">
                <label className="inline-flex items-center gap-2 text-sm text-[var(--text)]">
                    <input
                        type="checkbox"
                        checked={gapsOnly}
                        onChange={(e) => setGapsOnly(e.target.checked)}
                        className="accent-[var(--accent)]"
                    />
                    Gaps only ({GAP_KINDS.join(', ')})
                </label>
                <input
                    type="search"
                    placeholder="Filter ticker…"
                    value={filterCode}
                    onChange={(e) => setFilterCode(e.target.value)}
                    className="h-9 w-36 rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 font-[family-name:var(--talir-mono)] text-sm text-[var(--text)]"
                />
            </div>

            <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                <table className="w-full min-w-[720px] text-left text-sm">
                    <thead className="border-b border-[var(--border)] bg-[var(--bg)] font-[family-name:var(--talir-mono)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                        <tr>
                            <th className="px-3 py-2">Ticker</th>
                            <th className="px-3 py-2">Year</th>
                            <th className="px-3 py-2">Kind</th>
                            <th className="px-3 py-2">DPS</th>
                            <th className="px-3 py-2">MSE</th>
                            <th className="px-3 py-2">Ex</th>
                            <th className="px-3 py-2">Source</th>
                            <th className="px-3 py-2" />
                        </tr>
                    </thead>
                    <tbody>
                        {rows.length === 0 && (
                            <tr>
                                <td colSpan={8} className="px-3 py-4 text-[var(--text-muted)]">
                                    No rows match the filter.
                                </td>
                            </tr>
                        )}
                        {rows.map((cell) => (
                            <tr
                                key={`${cell.stockCode}-${cell.profitYear}-${cell.kind}`}
                                className="border-b border-[var(--border)]"
                            >
                                <td className="px-3 py-2 font-[family-name:var(--talir-mono)] tabular-nums">
                                    {cell.stockCode}
                                </td>
                                <td className="px-3 py-2 font-[family-name:var(--talir-mono)] tabular-nums">
                                    {cell.profitYear}
                                </td>
                                <td className="px-3 py-2 font-[family-name:var(--talir-mono)] text-xs">
                                    {cell.kind}
                                </td>
                                <td className="px-3 py-2 font-[family-name:var(--talir-mono)] tabular-nums">
                                    {cell.grossPerShare ?? '—'}
                                </td>
                                <td className="px-3 py-2 font-[family-name:var(--talir-mono)] tabular-nums">
                                    {cell.mseDps ?? '—'}
                                </td>
                                <td className="px-3 py-2 font-[family-name:var(--talir-mono)] tabular-nums">
                                    {cell.exDate ?? '—'}
                                </td>
                                <td className="px-3 py-2">{cell.source ?? '—'}</td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onLoadGap(cell)}
                                        >
                                            Override
                                        </Button>
                                        {cell.url ? (
                                            <a
                                                href={cell.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="inline-flex h-8 items-center px-2 text-xs text-[var(--accent)] underline"
                                            >
                                                SECnet
                                            </a>
                                        ) : null}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {rows.length >= 200 ? (
                <p className="text-xs text-[var(--text-muted)]">Showing first 200 rows.</p>
            ) : null}
        </section>
    )
}
