'use client'

import { useCallback, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import type { DividendCalendarEntry, DividendsCalendarFile } from '@/lib/dividends'
import {
    countCalendarsInLastYears,
    earliestCalendarYear,
    highestDisclosedGross,
    inferPayoutFrequency,
    latestParsedDividend,
    mostCalendarFilings,
    nextUpcomingExDividend,
    resolveProfitYear,
} from '@/lib/dividends'
import { DividendHistoryChart } from '@/components/dividends/DividendHistoryChart'
import { DividendRow } from '@/components/dividends/DividendRow'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { ChangeLabel } from '@/components/ui/ChangeLabel'
import { cn, formatNewsDate } from '@/lib/utils'

type LeaderboardTab = 'recent' | 'upcoming' | 'highest' | 'consistent'

interface DividendsPageClientProps {
    calendar: DividendsCalendarFile
    asOfDate: string
}

export function DividendsPageClient({ calendar, asOfDate }: DividendsPageClientProps) {
    const router = useRouter()
    const searchParams = useSearchParams()

    const issuerOptions = useMemo(() => {
        return Object.entries(calendar.byIssuer)
            .map(([code, entries]) => ({
                code,
                name: entries[0]?.stockName ?? code,
                count: entries.length,
            }))
            .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    }, [calendar.byIssuer])

    const paramCode = searchParams.get('code')
    const selectedCode =
        paramCode && calendar.byIssuer[paramCode]
            ? paramCode
            : issuerOptions[0]?.code ?? null

    const selectedEntries = selectedCode ? calendar.byIssuer[selectedCode] ?? [] : []
    const upcomingIssuer = nextUpcomingExDividend(selectedEntries)
    const latestParsed = latestParsedDividend(selectedEntries)
    const latestFy = latestParsed ? resolveProfitYear(latestParsed) : null
    const sinceYear = earliestCalendarYear(selectedEntries)
    const calendars5y = countCalendarsInLastYears(selectedEntries, 5)
    const payoutFrequency = inferPayoutFrequency()

    const [leaderboardTab, setLeaderboardTab] = useState<LeaderboardTab>('recent')

    const setSelectedCode = useCallback(
        (code: string) => {
            const params = new URLSearchParams(searchParams.toString())
            params.set('code', code)
            router.replace(`/dividends?${params.toString()}`, { scroll: false })
        },
        [router, searchParams]
    )

    const leaderboardContent = useMemo(() => {
        switch (leaderboardTab) {
            case 'upcoming':
                return calendar.upcomingExDates.length ? (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {calendar.upcomingExDates.map((entry) => (
                            <DividendRow key={`up-${entry.stockCode}-${entry.exDate}`} entry={entry} />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary py-4 text-center">No upcoming parsed ex-dates.</p>
                )
            case 'highest':
                return (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {highestDisclosedGross(calendar.all, 12).map((entry) => (
                            <DividendRow key={`hi-${entry.url}`} entry={entry} />
                        ))}
                    </div>
                )
            case 'consistent':
                return (
                    <ul className="space-y-2">
                        {mostCalendarFilings(calendar.all, 5).slice(0, 12).map((row) => (
                            <li key={row.stockCode}>
                                <button
                                    type="button"
                                    onClick={() => setSelectedCode(row.stockCode)}
                                    className="flex w-full items-center justify-between gap-2 rounded-lg px-2 py-2 text-left hover:bg-surface-secondary/50 transition-colors"
                                >
                                    <span className="font-data text-sm font-semibold text-text-primary">
                                        {row.stockCode}
                                    </span>
                                    <span className="font-data text-xs text-text-secondary tabular-nums">
                                        {row.count} filings · 5y
                                    </span>
                                </button>
                            </li>
                        ))}
                    </ul>
                )
            case 'recent':
            default:
                return (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {calendar.recent.slice(0, 15).map((entry) => (
                            <DividendRow key={`${entry.stockCode}-${entry.filedAt}-${entry.url}`} entry={entry} />
                        ))}
                    </div>
                )
        }
    }, [calendar, leaderboardTab, setSelectedCode])

    const showChart =
        selectedEntries.filter((e) => e.parseStatus === 'parsed' && e.grossPerShare !== null).length >= 2

    return (
        <div className="flex flex-col gap-8 min-w-0">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold font-heading text-text-primary tracking-tight">
                    Dividends
                </h1>
                <p className="text-sm text-text-secondary">
                    SECNet dividend calendars · end-of-day prices · not a forecast
                </p>
                <DataFreshnessLabel asOfDate={asOfDate} />
            </header>

            <section className="space-y-4 min-w-0" aria-labelledby="dividends-deep-dive">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
                    <div className="space-y-1">
                        <h2 id="dividends-deep-dive" className="text-lg font-semibold font-heading text-text-primary">
                            Company deep-dive
                        </h2>
                        <p className="text-xs font-data text-text-tertiary">
                            {calendar.all.length} calendars · {Object.keys(calendar.byIssuer).length} issuers in dataset
                        </p>
                    </div>
                    {issuerOptions.length > 0 ? (
                        <label className="flex flex-col gap-1 min-w-[200px]">
                            <span className="text-[11px] font-data text-text-tertiary uppercase tracking-wide">
                                Issuer
                            </span>
                            <select
                                value={selectedCode ?? ''}
                                onChange={(e) => setSelectedCode(e.target.value)}
                                className="h-10 rounded-lg border border-border bg-surface px-3 text-sm font-data text-text-primary"
                            >
                                {issuerOptions.map((opt) => (
                                    <option key={opt.code} value={opt.code}>
                                        {opt.code} · {opt.name} ({opt.count})
                                    </option>
                                ))}
                            </select>
                        </label>
                    ) : null}
                </div>

                {selectedCode && selectedEntries.length > 0 ? (
                    <div className="rounded-xl border border-border bg-surface p-4 sm:p-6 space-y-4 min-w-0">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                                <Link
                                    href={`/stock/${selectedCode}`}
                                    className="font-heading text-xl font-bold text-text-primary hover:text-accent"
                                >
                                    {selectedEntries[0].stockName}
                                </Link>
                                <p className="text-xs font-data text-text-tertiary mt-1">
                                    {selectedCode}
                                    {sinceYear ? ` · calendars since ${sinceYear}` : ''}
                                    {' · '}
                                    {payoutFrequency} (MSE)
                                    {' · '}
                                    {calendars5y} in 5y
                                </p>
                            </div>
                            {upcomingIssuer ? (
                                <div className="text-right">
                                    <p className="text-[11px] text-text-tertiary font-data">Next ex-date</p>
                                    <p className="font-data text-lg font-semibold text-text-primary tabular-nums">
                                        {formatNewsDate(upcomingIssuer.exDate!)}
                                    </p>
                                </div>
                            ) : latestParsed?.trailingYieldAtEx !== null &&
                              latestParsed?.trailingYieldAtEx !== undefined ? (
                                <div className="text-right">
                                    <p className="text-[11px] text-text-tertiary font-data">Yield at last ex-date</p>
                                    <p className="font-data text-lg font-semibold text-text-primary tabular-nums">
                                        {latestParsed.trailingYieldAtEx.toFixed(2)}%
                                    </p>
                                </div>
                            ) : null}
                        </div>

                        {showChart ? (
                            <DividendHistoryChart entries={selectedEntries} />
                        ) : (
                            <p className="text-sm text-text-tertiary font-data py-4 border border-dashed border-border rounded-lg text-center px-4">
                                Payout chart needs at least two fully parsed calendars with disclosed gross per share.
                            </p>
                        )}

                        {latestParsed ? (
                            <dl className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-border">
                                <Metric
                                    label="Last gross"
                                    value={`${latestParsed.grossPerShare!.toLocaleString('en-US')} ден.${latestFy ? ` (FY ${latestFy})` : ''}`}
                                />
                                {latestParsed.payoutRatioPct !== null && latestParsed.payoutRatioPct !== undefined ? (
                                    <Metric
                                        label="Payout ratio"
                                        value={`${latestParsed.payoutRatioPct.toFixed(1)}%`}
                                    />
                                ) : null}
                                {latestParsed.yoyGrowthPct !== null && latestParsed.yoyGrowthPct !== undefined ? (
                                    <div>
                                        <dt className="text-[11px] text-text-tertiary font-data">YoY gross</dt>
                                        <dd className="mt-0.5">
                                            <ChangeLabel change={latestParsed.yoyGrowthPct} />
                                        </dd>
                                    </div>
                                ) : null}
                            </dl>
                        ) : null}

                        <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1 max-h-[320px] overflow-y-auto">
                            {selectedEntries.map((entry) => (
                                <DividendRow key={entry.url} entry={entry} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary py-8 text-center border border-dashed border-border rounded-xl">
                        No dividend calendars in the current dataset.
                    </p>
                )}
            </section>

            <section className="space-y-3 min-w-0" aria-labelledby="dividends-leaderboards">
                <div className="flex items-center gap-2">
                    <h2 id="dividends-leaderboards" className="text-lg font-semibold font-heading text-text-primary">
                        Market leaderboards
                    </h2>
                    <InfoPopover label="leaderboards">
                        Filing-based views only. Highest gross uses parsed SECNet calendars; consistency counts calendar
                        filings in the last five years.
                    </InfoPopover>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            ['recent', 'Recent filings'],
                            ['upcoming', 'Upcoming ex-dates'],
                            ['highest', 'Highest gross'],
                            ['consistent', 'Most filings (5y)'],
                        ] as const
                    ).map(([id, label]) => (
                        <button
                            key={id}
                            type="button"
                            onClick={() => setLeaderboardTab(id)}
                            className={cn(
                                'px-3 py-1.5 rounded-lg text-xs font-data font-medium border transition-colors',
                                leaderboardTab === id
                                    ? 'border-accent/40 bg-accent/10 text-accent'
                                    : 'border-border text-text-secondary hover:text-text-primary'
                            )}
                        >
                            {label}
                        </button>
                    ))}
                </div>

                {leaderboardContent}

                <p className="text-[11px] font-data text-text-tertiary pt-2">
                    Table view also on{' '}
                    <Link href="/markets?view=dividends" className="text-accent hover:underline">
                        Markets → Dividends
                    </Link>
                    . Under MSE listing rules, dividend calendars are filed after shareholders&apos; assembly approval.
                </p>
            </section>
        </div>
    )
}

function Metric({ label, value }: { label: string; value: string }) {
    return (
        <div>
            <dt className="text-[11px] text-text-tertiary font-data">{label}</dt>
            <dd className="font-data text-sm font-semibold text-text-primary tabular-nums mt-0.5">{value}</dd>
        </div>
    )
}
