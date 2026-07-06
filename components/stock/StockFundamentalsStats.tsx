'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { StockValuationSnapshot } from '@/lib/stock-valuation'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { useLocale } from '@/components/providers/LocaleProvider'
import { displayFilingSource } from '@/lib/i18n/display-source'
import { formatNewsDate } from '@/lib/utils'
import {
    formatEps,
    formatGrossDps,
    formatNetProfit,
    formatPeRatio,
    formatPercent,
} from '@/lib/stock-fundamentals-display'

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

export function StockFundamentalsStats({ snapshot, asOfDate }: StockFundamentalsStatsProps) {
    const { locale, t } = useLocale()

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

    const fyLabel = snapshot.fiscalYear ? ` · ${t('common.fy', { year: snapshot.fiscalYear })}` : ''

    return (
        <div className="space-y-3 pt-2 border-t border-border">
            {showFundamentalsSection ? (
                <div className="space-y-0">
                    <p className="text-[10px] font-data uppercase tracking-wide text-text-tertiary pb-1">
                        {t('stock.fundamentals.section')}
                        {fyLabel}
                    </p>

                    {snapshot.eps !== null ? (
                        <StatRow
                            label={t('stock.fundamentals.eps')}
                            value={formatEps(snapshot.eps)}
                            info={t('stock.fundamentals.epsHelp')}
                        />
                    ) : null}

                    {snapshot.netProfit !== null ? (
                        <StatRow
                            label={t('stock.fundamentals.netProfit')}
                            value={formatNetProfit(snapshot.netProfit)}
                            info={t('stock.fundamentals.netProfitHelp')}
                        />
                    ) : null}

                    {snapshot.peRatio !== null ? (
                        <StatRow
                            label={t('stock.fundamentals.pe')}
                            value={formatPeRatio(snapshot.peRatio)}
                            info={t('stock.fundamentals.peHelp')}
                        />
                    ) : null}

                    {snapshot.earningsYieldPct !== null ? (
                        <StatRow
                            label={t('stock.fundamentals.earningsYield')}
                            value={formatPercent(snapshot.earningsYieldPct)}
                            info={t('stock.fundamentals.earningsYieldHelp')}
                        />
                    ) : null}
                </div>
            ) : null}

            {showDividendSection ? (
                <div className="space-y-0">
                    <p className="text-[10px] font-data uppercase tracking-wide text-text-tertiary pb-1">
                        {t('stock.fundamentals.dividendSection')}
                    </p>

                    {snapshot.grossPerShare !== null ? (
                        <StatRow
                            label={t('stock.fundamentals.grossDps')}
                            value={formatGrossDps(snapshot.grossPerShare, snapshot.dividendProfitYear)}
                            info={t('stock.fundamentals.grossDpsHelp')}
                        />
                    ) : null}

                    {snapshot.dividendYieldPct !== null ? (
                        <StatRow
                            label={t('stock.fundamentals.dividendYield')}
                            value={formatPercent(snapshot.dividendYieldPct)}
                            info={t('stock.fundamentals.dividendYieldHelp')}
                        />
                    ) : null}

                    {snapshot.payoutRatioPct !== null ? (
                        <StatRow
                            label={t('stock.fundamentals.payoutRatio')}
                            value={formatPercent(snapshot.payoutRatioPct, 1)}
                            info={t('stock.fundamentals.payoutHelp')}
                        />
                    ) : null}
                </div>
            ) : null}

            <p className="text-[10px] font-data text-text-tertiary leading-snug">
                {t('stock.fundamentals.dataLine', { date: formatNewsDate(asOfDate) })}
                {snapshot.filedAt
                    ? ` · ${t('stock.fundamentals.fyFiling', { date: formatNewsDate(snapshot.filedAt) })}`
                    : ''}
                {snapshot.filingUrl ? (
                    <>
                        {' · '}
                        <Link
                            href={snapshot.filingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline inline-flex items-center gap-0.5"
                        >
                            {displayFilingSource(locale, 'SECNet')}
                            <ExternalLink className="h-2.5 w-2.5" aria-hidden />
                        </Link>
                    </>
                ) : null}
            </p>
        </div>
    )
}
