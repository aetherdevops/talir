'use client'

import { ArrowRight } from 'lucide-react'
import type { Mbi10DividendHighlight } from '@/lib/dividend-home-banner'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn, formatInteger, formatNewsDate, formatPrice } from '@/lib/utils'

interface HomeDividendsPanelProps {
    highlights: Mbi10DividendHighlight[]
    variant?: 'aside' | 'mobile'
    className?: string
}

function formatDps(value: number): string {
    if (Number.isInteger(value) || Math.abs(value - Math.round(value)) < 1e-9) {
        return `${formatInteger(Math.round(value))} ден.`
    }
    return formatPrice(value)
}

function pickYoyChange(scorecard: Mbi10DividendHighlight['scorecard']): number | null {
    const yieldYoy = scorecard.yieldGrowthPct
    if (yieldYoy != null && Number.isFinite(yieldYoy)) return yieldYoy
    const dpsYoy = scorecard.yoyDpsGrowthPct
    if (dpsYoy != null && Number.isFinite(dpsYoy)) return dpsYoy
    return null
}

export function HomeDividendsPanel({
    highlights,
    variant = 'aside',
    className,
}: HomeDividendsPanelProps) {
    const { t } = useLocale()
    const isAside = variant === 'aside'

    return (
        <section
            className={cn(
                'min-w-0 rounded-xl border border-border overflow-hidden',
                'bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface)] to-[var(--surface)]',
                isAside && 'sticky top-4',
                className
            )}
            aria-labelledby="home-dividends-banner"
        >
            <div className="relative px-4 pt-4 pb-3 space-y-1 border-b border-border/80">
                <div
                    className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-70"
                    aria-hidden
                />
                <p className="font-data text-[10px] uppercase tracking-[0.2em] text-accent">
                    {t('dividends.bannerEyebrow')}
                </p>
                <h2
                    id="home-dividends-banner"
                    className={cn(
                        'font-heading font-semibold text-text-primary tracking-tight',
                        isAside ? 'text-xl' : 'text-lg'
                    )}
                >
                    {t('dividends.bannerTitle')}
                </h2>
                <p className="text-xs text-text-tertiary font-data leading-snug">
                    {t('dividends.bannerSubtitle')}
                </p>
            </div>

            <ul className="divide-y divide-border/60">
                {highlights.length === 0 ? (
                    <li className="px-4 py-6 text-xs text-text-tertiary font-data">
                        {t('dividends.bannerEmpty')}
                    </li>
                ) : (
                    highlights.map((row) => {
                        const yieldPct = row.scorecard.trailingYieldPct
                        const yoyChange = pickYoyChange(row.scorecard)
                        const streak = row.scorecard.dividendStreakYears
                        const dps = row.scorecard.latestGrossPerShare
                        const fy = row.scorecard.latestProfitYear
                        const nextEx = row.upcoming?.exDate

                        return (
                            <li key={row.stockCode}>
                                <LocaleLink
                                    href={`/dividends?code=${encodeURIComponent(row.stockCode)}`}
                                    className="flex flex-col gap-1.5 px-4 py-3 hover:bg-surface-secondary/40 transition-colors min-w-0"
                                >
                                    <div className="flex items-start justify-between gap-2 min-w-0">
                                        <span className="font-data text-sm font-semibold text-text-primary tabular-nums">
                                            {row.stockCode}
                                        </span>
                                        {yieldPct != null && Number.isFinite(yieldPct) ? (
                                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                                                <span
                                                    className={cn(
                                                        'font-data text-sm font-semibold tabular-nums',
                                                        yoyChange != null ? 'text-text-primary' : 'text-accent'
                                                    )}
                                                >
                                                    {yieldPct.toFixed(2)}%
                                                </span>
                                                {yoyChange != null ? (
                                                    <ChangeLabel change={yoyChange} className="text-[11px]" />
                                                ) : null}
                                            </div>
                                        ) : null}
                                    </div>
                                    <p className="text-xs text-text-tertiary truncate leading-snug">
                                        {row.stockName}
                                    </p>
                                    <div className="flex flex-wrap gap-x-3 gap-y-0.5 font-data text-xs text-text-secondary tabular-nums">
                                        {dps != null ? (
                                            <span>
                                                {formatDps(dps)}
                                                {fy != null ? ` · FY ${fy}` : ''}
                                            </span>
                                        ) : null}
                                        {streak > 0 ? (
                                            <span>
                                                {t('dividends.bannerStreak', { count: streak })}
                                            </span>
                                        ) : null}
                                        {nextEx ? (
                                            <span className="text-accent/90">
                                                {t('dividends.bannerNextEx', {
                                                    date: formatNewsDate(nextEx),
                                                })}
                                            </span>
                                        ) : null}
                                    </div>
                                </LocaleLink>
                            </li>
                        )
                    })
                )}
            </ul>

            <div className="px-4 py-3 border-t border-border/80 bg-surface-secondary/20">
                <LocaleLink
                    href="/dividends"
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline"
                >
                    {t('dividends.bannerCta')}
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                </LocaleLink>
                <p className="mt-1 text-[10px] font-data text-text-tertiary leading-snug">
                    {t('dividends.bannerFootnote')}
                </p>
            </div>
        </section>
    )
}
