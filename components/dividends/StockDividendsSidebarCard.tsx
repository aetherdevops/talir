'use client'

import Link from 'next/link'
import { ExternalLink } from 'lucide-react'
import type { DividendCalendarEntry } from '@/lib/dividends'
import {
    countCalendarYears,
    countCalendarsInLastYears,
    earliestCalendarYear,
    formatDividendRowDetail,
    inferPayoutFrequency,
    latestDisclosedDividend,
    latestParsedDividend,
    nextUpcomingExDividend,
    resolveProfitYear,
} from '@/lib/dividends'
import { DividendHistoryChart } from '@/components/dividends/DividendHistoryChart'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { formatNewsDate } from '@/lib/utils'

interface StockDividendsSidebarCardProps {
    dividends: DividendCalendarEntry[]
}

function LinkOnlyTimeline({ entries }: { entries: DividendCalendarEntry[] }) {
    const recent = [...entries]
        .sort((a, b) => b.filedAt.localeCompare(a.filedAt))
        .slice(0, 6)

    return (
        <div className="space-y-2">
            <p className="text-[11px] font-data text-text-tertiary leading-snug">
                Amounts not parsed from SECNet document yet. Filing dates shown below — open the calendar on SECNet for
                details.
            </p>
            <ul className="space-y-1.5" aria-label="Dividend calendar filing dates">
                {recent.map((entry) => (
                    <li key={entry.url} className="flex items-center gap-2 min-w-0">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-accent/70" aria-hidden />
                        <span className="flex-1 min-w-0 truncate font-data text-xs text-text-secondary tabular-nums">
                            {formatNewsDate(entry.filedAt)}
                        </span>
                        <a
                            href={entry.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 inline-flex items-center justify-center h-7 w-7 text-text-tertiary hover:text-accent transition-colors"
                            aria-label={`Open SECNet dividend calendar filed ${formatNewsDate(entry.filedAt)}`}
                        >
                            <ExternalLink className="h-3.5 w-3.5" aria-hidden />
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    )
}

export function StockDividendsSidebarCard({ dividends }: StockDividendsSidebarCardProps) {
    if (!dividends.length) return null

    const sorted = [...dividends].sort((a, b) =>
        (b.exDate ?? b.filedAt).localeCompare(a.exDate ?? a.filedAt)
    )
    const parsedForChart = sorted.filter(
        (entry) => entry.parseStatus === 'parsed' && entry.grossPerShare !== null
    )
    const showChart = parsedForChart.length >= 2
    const upcoming = nextUpcomingExDividend(sorted)
    const latestDisclosed = latestDisclosedDividend(sorted)
    const latestParsed = latestParsedDividend(sorted)
    const sinceYear = earliestCalendarYear(sorted)
    const calendarYears = countCalendarYears(sorted)
    const calendars5y = countCalendarsInLastYears(sorted, 5)
    const payoutFrequency = inferPayoutFrequency()
    const latestFy = latestDisclosed ? resolveProfitYear(latestDisclosed) : null

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold font-heading text-text-primary">Dividends</h2>
                        <p className="text-[11px] font-data text-text-tertiary">
                            SECNet · {payoutFrequency}
                            {sinceYear ? ` since ${sinceYear}` : ''}
                            {' · '}
                            not a forecast
                        </p>
                    </div>
                    <InfoPopover label="dividend data source">
                        From SECNet dividend calendar filings only. Charts use profit year, not payment date.
                    </InfoPopover>
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {upcoming ? (
                    <div className="rounded-lg border border-accent/25 bg-accent/5 px-3 py-2.5 space-y-0.5">
                        <p className="text-[11px] font-data uppercase tracking-wide text-accent">Next ex-date</p>
                        <p className="font-data text-sm font-semibold text-text-primary tabular-nums">
                            {formatNewsDate(upcoming.exDate!)}
                            {upcoming.grossPerShare !== null ? (
                                <span className="ml-2 text-xs font-normal text-text-secondary">
                                    {upcoming.grossPerShare.toLocaleString('en-US')} ден.
                                    {resolveProfitYear(upcoming) ? ` · FY ${resolveProfitYear(upcoming)}` : ''}
                                </span>
                            ) : null}
                        </p>
                    </div>
                ) : null}

                {showChart ? (
                    <DividendHistoryChart entries={sorted} />
                ) : latestDisclosed ? (
                    <p className="text-[11px] font-data text-text-tertiary leading-snug">
                        {latestDisclosed.parseStatus === 'partial'
                            ? 'Partial parse — chart needs two fully parsed calendars with gross amounts.'
                            : 'Chart needs two fully parsed calendars with gross amounts.'}
                    </p>
                ) : (
                    <LinkOnlyTimeline entries={sorted} />
                )}

                <dl className="grid grid-cols-2 gap-3">
                    {latestDisclosed ? (
                        <div className="space-y-0.5 col-span-2">
                            <dt className="flex items-center gap-1 text-[11px] text-text-secondary">
                                Last disclosed gross
                                <InfoPopover label="last disclosed gross">
                                    Gross dividend per share from the most recent SECNet calendar with a parsed amount.
                                    {latestDisclosed.parseStatus === 'partial'
                                        ? ' Partial parse — verify on SECNet.'
                                        : ''}
                                </InfoPopover>
                            </dt>
                            <dd className="font-data text-sm font-semibold text-text-primary tabular-nums">
                                {latestDisclosed.grossPerShare!.toLocaleString('en-US', {
                                    minimumFractionDigits: 0,
                                    maximumFractionDigits: 2,
                                })}{' '}
                                ден.
                                {latestFy ? (
                                    <span className="ml-1 text-xs font-normal text-text-tertiary">
                                        for FY {latestFy}
                                    </span>
                                ) : null}
                                {latestDisclosed.parseStatus === 'partial' ? (
                                    <span className="ml-1 text-xs font-normal text-text-tertiary">
                                        · partial parse
                                    </span>
                                ) : null}
                            </dd>
                        </div>
                    ) : null}

                    {latestParsed?.payoutRatioPct !== null && latestParsed?.payoutRatioPct !== undefined ? (
                        <div className="space-y-0.5">
                            <dt className="flex items-center gap-1 text-[11px] text-text-secondary">
                                Payout ratio
                                <InfoPopover label="payout ratio">
                                    Gross per share ÷ EPS from matching-year SECNet annual report. Both fields parsed
                                    from filings — not a forecast.
                                </InfoPopover>
                            </dt>
                            <dd className="font-data text-sm font-semibold text-text-primary tabular-nums">
                                {latestParsed.payoutRatioPct.toFixed(1)}%
                            </dd>
                        </div>
                    ) : null}

                    {latestParsed?.yoyGrowthPct !== null && latestParsed?.yoyGrowthPct !== undefined ? (
                        <div className="space-y-0.5">
                            <dt className="flex items-center gap-1 text-[11px] text-text-secondary">
                                YoY gross change
                                <InfoPopover label="YoY gross change">
                                    Change in disclosed gross per share vs the prior parsed calendar.
                                </InfoPopover>
                            </dt>
                            <dd className="font-data text-sm font-semibold tabular-nums">
                                <ChangeLabel change={latestParsed.yoyGrowthPct} />
                            </dd>
                        </div>
                    ) : null}

                    {latestParsed?.trailingYieldAtEx !== null && latestParsed?.trailingYieldAtEx !== undefined ? (
                        <div className="space-y-0.5">
                            <dt className="flex items-center gap-1 text-[11px] text-text-secondary">
                                Yield at ex-date
                                <InfoPopover label="yield at ex-date">
                                    Gross per share ÷ EOD close on ex-date — historical, not forward yield.
                                </InfoPopover>
                            </dt>
                            <dd className="font-data text-sm font-semibold text-text-primary tabular-nums">
                                {latestParsed.trailingYieldAtEx.toFixed(2)}%
                            </dd>
                        </div>
                    ) : null}

                    <div className="space-y-0.5">
                        <dt className="flex items-center gap-1 text-[11px] text-text-secondary">
                            Payout frequency
                            <InfoPopover label="payout frequency">
                                MSE issuers typically file one dividend calendar per year after the AGM. We do not
                                infer monthly or quarterly schedules unless filings clearly support it.
                            </InfoPopover>
                        </dt>
                        <dd className="font-data text-sm font-semibold text-text-primary capitalize tabular-nums">
                            {payoutFrequency} (MSE)
                        </dd>
                    </div>
                    <div className="space-y-0.5">
                        <dt className="flex items-center gap-1 text-[11px] text-text-secondary">
                            Calendars (5y)
                            <InfoPopover label="calendars in last five years">
                                SECNet dividend calendar disclosures filed in the last five calendar years — a
                                consistency proxy, not payout frequency.
                            </InfoPopover>
                        </dt>
                        <dd className="font-data text-sm font-semibold text-text-primary tabular-nums">
                            {calendars5y}
                        </dd>
                    </div>
                    <div className="space-y-0.5">
                        <dt className="flex items-center gap-1 text-[11px] text-text-secondary">
                            Calendars filed
                            <InfoPopover label="calendars filed">
                                SECNet dividend calendar disclosures in our dataset.
                            </InfoPopover>
                        </dt>
                        <dd className="font-data text-sm font-semibold text-text-primary tabular-nums">
                            {sorted.length}
                        </dd>
                    </div>
                    <div className="space-y-0.5">
                        <dt className="flex items-center gap-1 text-[11px] text-text-secondary">
                            Filing years
                            <InfoPopover label="filing years">
                                Distinct years with at least one calendar filing.
                            </InfoPopover>
                        </dt>
                        <dd className="font-data text-sm font-semibold text-text-primary tabular-nums">
                            {calendarYears}
                        </dd>
                    </div>
                </dl>

                {latestParsed ? (
                    <p className="text-[11px] font-data text-text-tertiary truncate">
                        {formatDividendRowDetail(latestParsed)}
                    </p>
                ) : latestDisclosed ? (
                    <p className="text-[11px] font-data text-text-tertiary truncate">
                        {formatDividendRowDetail(latestDisclosed)}
                    </p>
                ) : null}

                <Link
                    href="/dividends"
                    className="inline-flex items-center gap-1 text-xs font-data text-accent hover:underline"
                >
                    Dividend hub
                    <ExternalLink className="h-3 w-3" aria-hidden />
                </Link>
            </CardContent>
        </Card>
    )
}
