'use client'

import type { ReactNode } from 'react'
import { ExternalLink } from 'lucide-react'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { DividendCalendarEntry } from '@/lib/dividends'
import {
    earliestCalendarYear,
    latestDisclosedDividend,
    nextUpcomingExDividend,
    resolveProfitYear,
} from '@/lib/dividends'
import { buildDividendScorecard, type PayoutHealth } from '@/lib/dividend-scorecard'
import { DividendHistoryChart } from '@/components/dividends/DividendHistoryChart'
import { DividendYieldSparkline } from '@/components/dividends/DividendYieldSparkline'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { cn, formatNewsDate } from '@/lib/utils'

interface DividendScorecardPanelProps {
    stockCode: string
    dividends: DividendCalendarEntry[]
    currentPrice?: number | null
    firstTradeDate?: string | null
    showHubLink?: boolean
    className?: string
}

function payoutHealthLabel(health: PayoutHealth, t: (key: string) => string): string {
    switch (health) {
        case 'conservative':
            return t('dividends.payoutConservative')
        case 'typical':
            return t('dividends.payoutTypical')
        case 'stretched':
            return t('dividends.payoutStretched')
    }
}

function payoutHealthColor(health: PayoutHealth): string {
    switch (health) {
        case 'conservative':
            return 'var(--up)'
        case 'typical':
            return 'var(--accent)'
        case 'stretched':
            return 'var(--down)'
    }
}

function ScoreTile({
    label,
    value,
    hint,
    popover,
    large,
    children,
}: {
    label: string
    value: ReactNode
    hint?: string
    popover?: string
    large?: boolean
    children?: ReactNode
}) {
    return (
        <div
            className={cn(
                'rounded-lg border border-border bg-surface-secondary/30 px-3 py-2.5 space-y-1 min-w-0',
                large && 'sm:col-span-2'
            )}
        >
            <div className="flex items-center gap-1">
                <p className="text-[10px] font-data uppercase tracking-wide text-text-tertiary">{label}</p>
                {popover ? <InfoPopover label={label}>{popover}</InfoPopover> : null}
            </div>
            <div
                className={cn(
                    'font-data font-semibold text-text-primary tabular-nums',
                    large ? 'text-2xl' : 'text-sm'
                )}
            >
                {value}
            </div>
            {hint ? <p className="text-[10px] font-data text-text-tertiary leading-snug">{hint}</p> : null}
            {children}
        </div>
    )
}

export function DividendScorecardPanel({
    stockCode,
    dividends,
    currentPrice = null,
    firstTradeDate = null,
    showHubLink = false,
    className,
}: DividendScorecardPanelProps) {
    const { t } = useLocale()

    if (!dividends.length) return null

    const sorted = [...dividends].sort((a, b) =>
        (b.exDate ?? b.filedAt).localeCompare(a.exDate ?? a.filedAt)
    )
    const scorecard = buildDividendScorecard({
        stockCode,
        entries: sorted,
        currentPrice,
        firstTradeDate,
    })
    const upcoming = nextUpcomingExDividend(sorted)
    const latestDisclosed = latestDisclosedDividend(sorted)
    const parsedForChart = sorted.filter(
        (entry) => entry.parseStatus === 'parsed' && entry.grossPerShare !== null
    )
    const showChart = parsedForChart.length >= 2
    const sinceYear = earliestCalendarYear(sorted)
    const payoutFrequency = t('common.annual')

    return (
        <div className={cn('space-y-4 min-w-0', className)}>
            {upcoming ? (
                <div className="rounded-lg border border-accent/25 bg-accent/5 px-3 py-2.5 space-y-0.5">
                    <p className="text-[11px] font-data uppercase tracking-wide text-accent">{t('dividends.nextExDate')}</p>
                    <p className="font-data text-sm font-semibold text-text-primary tabular-nums">
                        {formatNewsDate(upcoming.exDate!)}
                        {upcoming.grossPerShare !== null ? (
                            <span className="ml-2 text-xs font-normal text-text-secondary">
                                {upcoming.grossPerShare.toLocaleString('en-US')} {t('common.den')}
                                {resolveProfitYear(upcoming)
                                    ? ` · ${t('common.fy', { year: resolveProfitYear(upcoming)! })}`
                                    : ''}
                            </span>
                        ) : null}
                    </p>
                </div>
            ) : null}

            {showChart ? (
                <DividendHistoryChart entries={sorted} />
            ) : latestDisclosed ? (
                <p className="text-[11px] font-data text-text-tertiary leading-snug rounded-lg border border-dashed border-border px-3 py-2.5">
                    {latestDisclosed.parseStatus === 'partial'
                        ? t('dividends.chartPartial')
                        : t('dividends.chartNeedsTwo')}
                </p>
            ) : (
                <p className="text-[11px] font-data text-text-tertiary leading-snug rounded-lg border border-dashed border-border px-3 py-2.5">
                    {t('dividends.notParsedYet')}
                </p>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                {scorecard.trailingYieldPct !== null ? (
                    <ScoreTile
                        label={t('dividends.dividendYield')}
                        value={`${scorecard.trailingYieldPct.toFixed(2)}%`}
                        hint={
                            currentPrice ? t('dividends.yieldHintPrice') : t('dividends.yieldHintEx')
                        }
                        popover={t('dividends.scorecardHelp.trailingYield')}
                        large
                    />
                ) : null}

                {scorecard.yoyDpsGrowthPct !== null ? (
                    <ScoreTile
                        label={t('dividends.yoyDps')}
                        value={<ChangeLabel change={scorecard.yoyDpsGrowthPct} />}
                        popover={t('dividends.scorecardHelp.yoyDps')}
                    />
                ) : null}

                {scorecard.payoutRatioPct !== null ? (
                    <ScoreTile
                        label={t('dividends.earningsPayout')}
                        value={`${scorecard.payoutRatioPct.toFixed(1)}%`}
                        hint={
                            scorecard.payoutHealth
                                ? payoutHealthLabel(scorecard.payoutHealth, t)
                                : t('dividends.scorecardHelp.payoutHint')
                        }
                        popover={t('dividends.scorecardHelp.payoutRatio')}
                    >
                        <div
                            className="h-1.5 rounded-full bg-surface-2 overflow-hidden mt-1"
                            aria-hidden
                        >
                            <div
                                className="h-full rounded-full transition-all"
                                style={{
                                    width: `${Math.min(scorecard.payoutRatioPct, 100)}%`,
                                    background: scorecard.payoutHealth
                                        ? payoutHealthColor(scorecard.payoutHealth)
                                        : 'var(--accent)',
                                }}
                            />
                        </div>
                    </ScoreTile>
                ) : null}

                {scorecard.dividendStreakYears > 0 ? (
                    <ScoreTile
                        label={t('dividends.dividendStreak')}
                        value={`${scorecard.dividendStreakYears} yr`}
                        hint={t('dividends.streakHint')}
                        popover={t('dividends.scorecardHelp.streak')}
                    />
                ) : null}

                {scorecard.disclosedDividendCount > 0 ? (
                    <ScoreTile
                        label={t('dividends.dividendsPaid')}
                        value={String(scorecard.disclosedDividendCount)}
                        hint={
                            scorecard.coverageSinceYear
                                ? t('dividends.paidHint', { year: scorecard.coverageSinceYear })
                                : undefined
                        }
                        popover={t('dividends.scorecardHelp.coverage')}
                    />
                ) : null}

                {scorecard.yieldGrowthPct !== null ? (
                    <ScoreTile
                        label={t('dividends.yieldChange')}
                        value={<ChangeLabel change={scorecard.yieldGrowthPct} />}
                        hint={t('dividends.yieldChangeHint')}
                        popover={t('dividends.scorecardHelp.yieldChange')}
                    />
                ) : null}
            </div>

            {scorecard.yieldAtExSeries.length >= 2 ? (
                <DividendYieldSparkline series={scorecard.yieldAtExSeries} />
            ) : null}

            <p className="text-[11px] font-data text-text-tertiary leading-snug">
                {t('dividends.contextLine', {
                    count: scorecard.calendarCount,
                    frequency: payoutFrequency,
                    since: sinceYear ? t('dividends.sinceYear', { year: sinceYear }) : '',
                })}
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1">
                <a
                    href={scorecard.seinetSourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-data text-accent hover:underline"
                >
                    {t('dividends.viewAllSecnet')}
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                </a>
                {showHubLink ? (
                    <LocaleLink
                        href="/dividends"
                        className="inline-flex items-center gap-1 text-xs font-data text-text-secondary hover:text-accent"
                    >
                        {t('dividends.dividendHub')}
                        <ExternalLink className="h-3 w-3" aria-hidden />
                    </LocaleLink>
                ) : null}
            </div>
        </div>
    )
}
