'use client'

import { useCallback, useMemo, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'
import type { DividendCalendarEntry, DividendsCalendarFile } from '@/lib/dividends'
import {
    countCalendarsInLastYears,
    earliestCalendarYear,
    highestDisclosedGross,
    mostCalendarFilings,
} from '@/lib/dividends'
import { DividendScorecardPanel } from '@/components/dividends/DividendScorecardPanel'
import { DividendRow } from '@/components/dividends/DividendRow'
import { DataFreshnessLabel } from '@/components/markets/DataFreshnessLabel'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { cn } from '@/lib/utils'

type LeaderboardTab = 'recent' | 'upcoming' | 'highest' | 'consistent'

interface DividendsPageClientProps {
    calendar: DividendsCalendarFile
    asOfDate: string
    priceByCode: Record<string, number>
    firstTradeByCode: Record<string, string>
}

export function DividendsPageClient({ calendar, asOfDate, priceByCode, firstTradeByCode }: DividendsPageClientProps) {
    const { t } = useLocale()
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
    const sinceYear = earliestCalendarYear(selectedEntries)
    const calendars5y = countCalendarsInLastYears(selectedEntries, 5)

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
                            <DividendRow
                                key={`up-${entry.stockCode}-${entry.exDate}`}
                                entry={entry}
                                onSelectCode={setSelectedCode}
                                selected={entry.stockCode === selectedCode}
                            />
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary py-4 text-center">{t('dividends.noUpcoming')}</p>
                )
            case 'highest':
                return (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {highestDisclosedGross(calendar.all, 12).map((entry) => (
                            <DividendRow
                                key={`hi-${entry.url}`}
                                entry={entry}
                                onSelectCode={setSelectedCode}
                                selected={entry.stockCode === selectedCode}
                            />
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
                                        {t('dividends.in5y', { count: row.count })}
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
                            <DividendRow
                                key={`${entry.stockCode}-${entry.filedAt}-${entry.url}`}
                                entry={entry}
                                onSelectCode={setSelectedCode}
                                selected={entry.stockCode === selectedCode}
                            />
                        ))}
                    </div>
                )
        }
    }, [calendar, leaderboardTab, selectedCode, setSelectedCode, t])

    const selectedPrice = selectedCode ? priceByCode[selectedCode] ?? null : null
    const selectedFirstTrade = selectedCode ? firstTradeByCode[selectedCode] ?? null : null

    return (
        <div className="flex flex-col gap-8 min-w-0">
            <header className="flex flex-col gap-2">
                <h1 className="text-2xl sm:text-3xl font-semibold font-heading text-text-primary tracking-tight">
                    {t('dividends.title')}
                </h1>
                <p className="text-sm text-text-secondary">{t('dividends.subtitle')}</p>
                <DataFreshnessLabel asOfDate={asOfDate} />
            </header>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)] gap-8 min-w-0 items-start">
            <section className="space-y-4 min-w-0" aria-labelledby="dividends-deep-dive">
                <div className="flex flex-col sm:flex-row sm:items-end gap-3 justify-between">
                    <div className="space-y-1">
                        <h2 id="dividends-deep-dive" className="text-lg font-semibold font-heading text-text-primary">
                            {t('dividends.deepDive')}
                        </h2>
                        <p className="text-xs font-data text-text-tertiary">
                            {t('dividends.datasetSummary', {
                                calendars: calendar.all.length,
                                issuers: Object.keys(calendar.byIssuer).length,
                            })}
                        </p>
                    </div>
                    {issuerOptions.length > 0 ? (
                        <label className="flex flex-col gap-1 min-w-[200px]">
                            <span className="text-[11px] font-data text-text-tertiary uppercase tracking-wide">
                                {t('dividends.issuer')}
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
                                <LocaleLink
                                    href={`/stock/${selectedCode}`}
                                    className="font-heading text-xl font-bold text-text-primary hover:text-accent"
                                >
                                    {selectedEntries[0].stockName}
                                </LocaleLink>
                                <p className="text-xs font-data text-text-tertiary mt-1">
                                    {selectedCode}
                                    {sinceYear ? ` · ${t('dividends.calendarsSince', { year: sinceYear })}` : ''}
                                    {' · '}
                                    {t('dividends.annualMse')}
                                    {' · '}
                                    {t('dividends.in5y', { count: calendars5y })}
                                </p>
                            </div>
                        </div>

                        <DividendScorecardPanel
                            stockCode={selectedCode}
                            dividends={selectedEntries}
                            currentPrice={selectedPrice}
                            firstTradeDate={selectedFirstTrade}
                        />
                    </div>
                ) : (
                    <p className="text-sm text-text-tertiary py-8 text-center border border-dashed border-border rounded-xl">
                        {t('dividends.noCalendars')}
                    </p>
                )}
            </section>

            <section className="space-y-3 min-w-0 xl:sticky xl:top-4" aria-labelledby="dividends-leaderboards">
                <div className="flex items-center gap-2">
                    <h2 id="dividends-leaderboards" className="text-lg font-semibold font-heading text-text-primary">
                        {t('dividends.leaderboards')}
                    </h2>
                    <InfoPopover label={t('dividends.leaderboards')}>{t('dividends.hubFootnote')}</InfoPopover>
                </div>

                <div className="flex flex-wrap gap-2">
                    {(
                        [
                            ['recent', t('dividends.recentFilings')],
                            ['upcoming', t('dividends.upcomingExDates')],
                            ['highest', t('dividends.highestGross')],
                            ['consistent', t('dividends.mostFilings')],
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

                <div className="rounded-xl border border-border bg-surface overflow-hidden">
                    {leaderboardContent}
                </div>

                <p className="text-[11px] font-data text-text-tertiary pt-1">
                    <LocaleLink href="/markets?view=dividends" className="text-accent hover:underline">
                        {t('dividends.marketsLink')}
                    </LocaleLink>
                    . {t('dividends.regulatoryNote')}
                </p>
            </section>
            </div>
        </div>
    )
}
