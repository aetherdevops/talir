'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { FundamentalEntry } from '@/lib/fundamentals'
import {
    formatEps,
    formatNetProfit,
} from '@/lib/stock-fundamentals-display'
import { formatNewsDate } from '@/lib/utils'

interface StockFinancialsTabProps {
    fundamentals: FundamentalEntry[]
    asOfDate: string
}

function dedupeByFiscalYear(entries: FundamentalEntry[]): FundamentalEntry[] {
    const rank: Record<FundamentalEntry['parseStatus'], number> = {
        parsed: 2,
        partial: 1,
        link_only: 0,
    }
    const byYear = new Map<number, FundamentalEntry>()

    for (const entry of entries) {
        const existing = byYear.get(entry.fiscalYear)
        if (!existing) {
            byYear.set(entry.fiscalYear, entry)
            continue
        }
        const rankNew = rank[entry.parseStatus]
        const rankOld = rank[existing.parseStatus]
        if (rankNew > rankOld || (rankNew === rankOld && entry.filedAt > existing.filedAt)) {
            byYear.set(entry.fiscalYear, entry)
        }
    }

    return [...byYear.values()].sort((a, b) => b.fiscalYear - a.fiscalYear)
}

export function StockFinancialsTab({ fundamentals, asOfDate }: StockFinancialsTabProps) {
    const rows = dedupeByFiscalYear(
        fundamentals.filter((e) => e.parseStatus !== 'link_only' || e.netProfit !== null || e.eps !== null)
    )

    if (!rows.length) {
        return (
            <p className="text-sm text-text-secondary py-4">
                No parsed annual financials from SECNet for this issuer yet. Check Updates for filing links.
            </p>
        )
    }

    return (
        <div className="space-y-4">
            <p className="text-xs font-data text-text-secondary">
                Annual reports from SECNet · Data as of {formatNewsDate(asOfDate)} · end-of-day close, not live
            </p>
            <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm min-w-[480px]">
                    <thead>
                        <tr className="border-b border-border bg-surface-secondary/50">
                            <th className="text-left py-2.5 px-3 text-xs font-data text-text-secondary font-medium">
                                Fiscal year
                            </th>
                            <th className="text-right py-2.5 px-3 text-xs font-data text-text-secondary font-medium">
                                EPS
                            </th>
                            <th className="text-right py-2.5 px-3 text-xs font-data text-text-secondary font-medium">
                                Net profit
                            </th>
                            <th className="text-left py-2.5 px-3 text-xs font-data text-text-secondary font-medium">
                                Filed
                            </th>
                            <th className="text-right py-2.5 px-3 text-xs font-data text-text-secondary font-medium">
                                Source
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={`${row.fiscalYear}-${row.url}`} className="border-b border-border/50 last:border-0">
                                <td className="py-2.5 px-3 font-data tabular-nums text-text-primary">FY {row.fiscalYear}</td>
                                <td className="py-2.5 px-3 text-right font-data tabular-nums text-text-primary">
                                    {row.eps != null ? formatEps(row.eps) : '—'}
                                </td>
                                <td className="py-2.5 px-3 text-right font-data tabular-nums text-text-primary">
                                    {row.netProfit != null ? formatNetProfit(row.netProfit) : '—'}
                                </td>
                                <td className="py-2.5 px-3 font-data text-text-secondary tabular-nums text-xs">
                                    {formatNewsDate(row.filedAt)}
                                </td>
                                <td className="py-2.5 px-3 text-right">
                                    <Link
                                        href={row.url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 text-xs text-accent hover:underline font-data"
                                    >
                                        SECNet
                                        <ExternalLink className="h-3 w-3" aria-hidden />
                                    </Link>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
