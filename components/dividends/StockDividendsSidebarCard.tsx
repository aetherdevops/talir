'use client'

import type { DividendCalendarEntry } from '@/lib/dividends'
import { earliestCalendarYear, latestDisclosedDividend, resolveProfitYear } from '@/lib/dividends'
import { DividendScorecardPanel } from '@/components/dividends/DividendScorecardPanel'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { InfoPopover } from '@/components/ui/InfoPopover'
import { useLocale } from '@/components/providers/LocaleProvider'

interface StockDividendsSidebarCardProps {
    stockCode: string
    dividends: DividendCalendarEntry[]
    currentPrice?: number | null
    firstTradeDate?: string | null
}

export function StockDividendsSidebarCard({
    stockCode,
    dividends,
    currentPrice = null,
    firstTradeDate = null,
}: StockDividendsSidebarCardProps) {
    const { t } = useLocale()

    if (!dividends.length) return null

    const sinceYear = earliestCalendarYear(dividends)
    const payoutFrequency = t('common.annual')

    return (
        <Card>
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                        <h2 className="text-lg font-bold font-heading text-text-primary">{t('dividends.cardTitle')}</h2>
                        <p className="text-[11px] font-data text-text-tertiary">
                            {t('dividends.cardSubtitle', {
                                frequency: payoutFrequency,
                                since: sinceYear ? t('dividends.sinceYear', { year: sinceYear }) : '',
                            })}
                        </p>
                    </div>
                    <InfoPopover label={t('dividends.dataSourcePopover')}>{t('dividends.sidebarNote')}</InfoPopover>
                </div>
            </CardHeader>
            <CardContent>
                <DividendScorecardPanel
                    stockCode={stockCode}
                    dividends={dividends}
                    currentPrice={currentPrice}
                    firstTradeDate={firstTradeDate}
                    showHubLink
                />
            </CardContent>
        </Card>
    )
}

/** Compact summary for the Updates tab — links to the dedicated dividends tab. */
export function StockDividendsUpdatesTeaser({
    dividends,
    onViewDividends,
}: {
    dividends: DividendCalendarEntry[]
    onViewDividends: () => void
}) {
    const { t } = useLocale()

    if (!dividends.length) return null

    const latest = latestDisclosedDividend(dividends)
    const fy = latest ? resolveProfitYear(latest) : null

    return (
        <section className="space-y-2" aria-labelledby="stock-dividends-heading">
            <div className="space-y-1">
                <h3 id="stock-dividends-heading" className="text-sm font-semibold font-heading text-text-primary">
                    {t('dividends.cardTitle')}
                </h3>
                <p className="text-[11px] font-data text-text-tertiary">
                    {latest?.grossPerShare != null
                        ? t('dividends.teaserLatest', {
                              amount: latest.grossPerShare.toLocaleString('en-US'),
                              den: t('common.den'),
                              fy: fy ? ` (${t('common.fy', { year: fy })})` : '',
                          })
                        : t('dividends.calendarsInDataset', { count: dividends.length })}
                    {' · '}
                    {t('dividends.teaserTabHint')}
                </p>
            </div>
            <button
                type="button"
                onClick={onViewDividends}
                className="text-xs font-data text-accent hover:underline min-h-[44px] px-1 -ml-1"
            >
                {t('dividends.viewAnalysis')}
            </button>
        </section>
    )
}
