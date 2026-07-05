'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { StockValuationSnapshot } from '@/lib/stock-valuation'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { formatDecimal, formatInteger, formatNewsDate } from '@/lib/utils'

interface StockFundamentalsStatsProps {
    snapshot: StockValuationSnapshot
    asOfDate: string
}

function StatRow({
    label,
    value,
    info,
}: {
    label: string
    value: string
    info: string
}) {
    return (
        <div className="flex justify-between items-center gap-3 py-2 border-b border-border/50">
            <span className="flex items-center gap-1 text-xs text-text-secondary shrink-0">
                {label}
                <InfoPopover label={label}>{info}</InfoPopover>
            </span>
            <span className="text-xs font-data font-medium text-text-primary tabular-nums text-right">
                {value}
            </span>
        </div>
    )
}

function formatNetProfit(value: number): string {
    if (value >= 1_000_000) {
        return `${formatDecimal(value / 1_000_000, 2)}M ден.`
    }
    return `${formatInteger(value)} ден.`
}

export function StockFundamentalsStats({ snapshot, asOfDate }: StockFundamentalsStatsProps) {
    if (!snapshot.hasAnyFundamentals) return null

    const showFundamentalsSection =
        snapshot.eps !== null ||
        snapshot.netProfit !== null ||
        snapshot.peRatio !== null ||
        snapshot.earningsYieldPct !== null

    const showDividendSection =
        snapshot.grossPerShare !== null ||
        snapshot.dividendYieldPct !== null ||
        snapshot.payoutRatioPct !== null

    return (
        <div className="space-y-3 pt-2 border-t border-border">
            {showFundamentalsSection ? (
                <div className="space-y-0">
                    <p className="text-[10px] font-data uppercase tracking-wide text-text-tertiary pb-1">
                        Fundamentals
                        {snapshot.fiscalYear ? ` · FY ${snapshot.fiscalYear}` : ''}
                    </p>

                    {snapshot.eps !== null ? (
                        <StatRow
                            label="EPS"
                            value={`${formatDecimal(snapshot.eps, 2)} ден.`}
                            info="Basic earnings per share from the latest SECNet audited annual report we parsed for this issuer."
                        />
                    ) : null}

                    {snapshot.netProfit !== null ? (
                        <StatRow
                            label="Net profit"
                            value={formatNetProfit(snapshot.netProfit)}
                            info="Net profit for the fiscal year from the same SECNet annual filing. Shown when parsed even if EPS is missing."
                        />
                    ) : null}

                    {snapshot.peRatio !== null ? (
                        <StatRow
                            label="P/E"
                            value={`${formatDecimal(snapshot.peRatio, 1)}×`}
                            info="End-of-day close divided by disclosed EPS for the fiscal year shown. Not a live multiple."
                        />
                    ) : null}

                    {snapshot.earningsYieldPct !== null ? (
                        <StatRow
                            label="Earnings yield"
                            value={`${formatDecimal(snapshot.earningsYieldPct, 2)}%`}
                            info="EPS divided by end-of-day close (inverse of P/E). From SECNet EPS and EOD price only."
                        />
                    ) : null}
                </div>
            ) : null}

            {showDividendSection ? (
                <div className="space-y-0">
                    <p className="text-[10px] font-data uppercase tracking-wide text-text-tertiary pb-1">
                        Dividend valuation
                    </p>

                    {snapshot.grossPerShare !== null ? (
                        <StatRow
                            label="Gross DPS"
                            value={`${formatDecimal(snapshot.grossPerShare, 2)} ден.${
                                snapshot.dividendProfitYear ? ` (FY ${snapshot.dividendProfitYear})` : ''
                            }`}
                            info="Latest fully parsed gross dividend per share from a SECNet dividend calendar."
                        />
                    ) : null}

                    {snapshot.dividendYieldPct !== null ? (
                        <StatRow
                            label="Dividend yield"
                            value={`${formatDecimal(snapshot.dividendYieldPct, 2)}%`}
                            info="Last disclosed gross DPS divided by end-of-day close. Trailing, not forward yield."
                        />
                    ) : null}

                    {snapshot.payoutRatioPct !== null ? (
                        <StatRow
                            label="Payout ratio"
                            value={`${formatDecimal(snapshot.payoutRatioPct, 1)}%`}
                            info="Gross DPS divided by EPS for the matching profit year. Both from SECNet filings."
                        />
                    ) : null}
                </div>
            ) : null}

            <p className="text-[10px] font-data text-text-tertiary leading-snug">
                Data as of {formatNewsDate(asOfDate)} · end-of-day close, not live
                {snapshot.filedAt ? ` · FY filing ${formatNewsDate(snapshot.filedAt)}` : ''}
                {snapshot.filingUrl ? (
                    <>
                        {' · '}
                        <Link
                            href={snapshot.filingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline inline-flex items-center gap-0.5"
                        >
                            SECNet
                            <ExternalLink className="h-2.5 w-2.5" aria-hidden />
                        </Link>
                    </>
                ) : null}
            </p>
        </div>
    )
}
