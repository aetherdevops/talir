'use client'

import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DividendCalendarEntry } from '@/lib/dividends'
import { resolveProfitYear } from '@/lib/dividends'
import { useLocale } from '@/components/providers/LocaleProvider'
import { formatNewsDate } from '@/lib/utils'

const CHART_HEIGHT = 160

interface DividendHistoryChartProps {
    entries: DividendCalendarEntry[]
}

export function DividendHistoryChart({ entries }: DividendHistoryChartProps) {
    const { t } = useLocale()
    const parsed = entries
        .filter((entry) => entry.parseStatus === 'parsed' && entry.grossPerShare !== null)
        .sort((a, b) => (resolveProfitYear(a) ?? 0) - (resolveProfitYear(b) ?? 0))

    if (parsed.length < 2) return null

    const data = parsed.map((entry) => {
        const fy = resolveProfitYear(entry)
        return {
            label: fy ? String(fy) : formatNewsDate(entry.exDate ?? entry.filedAt),
            grossPerShare: entry.grossPerShare as number,
            exDate: entry.exDate,
            paymentStart: entry.paymentStart,
        }
    })

    return (
        <div className="min-w-0 space-y-1">
            <p className="text-[10px] font-data text-text-tertiary">{t('dividends.chartCaption')}</p>
            <div style={{ height: CHART_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                        <XAxis
                            dataKey="label"
                            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            tick={{ fontSize: 10, fill: 'var(--text-muted)' }}
                            axisLine={false}
                            tickLine={false}
                            width={48}
                        />
                        <Tooltip
                            formatter={(value: number) => [`${value} ${t('common.den')}`, t('dividends.grossPerShare')]}
                            labelFormatter={(label, payload) => {
                                const row = payload?.[0]?.payload as (typeof data)[0] | undefined
                                if (!row) return `FY ${label}`
                                const parts = [`Profit year ${label}`]
                                if (row.exDate) parts.push(`ex ${formatNewsDate(row.exDate)}`)
                                if (row.paymentStart) parts.push(`pay from ${formatNewsDate(row.paymentStart)}`)
                                return parts.join(' · ')
                            }}
                            contentStyle={{
                                background: 'var(--surface)',
                                border: '1px solid var(--border)',
                                borderRadius: 8,
                                fontSize: 12,
                            }}
                        />
                        <Bar dataKey="grossPerShare" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    )
}
