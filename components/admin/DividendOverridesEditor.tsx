'use client'

import { useMemo, useState, useTransition } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import {
    deleteDividendOverrideAction,
    upsertDividendOverrideAction,
    type DividendOverrideView,
} from '@/lib/admin-dividends-actions'
import type { DividendParseStatus } from '@/lib/dividends'
import type { CoverageCell, DividendCoverageReport } from '@/lib/dividend-coverage'
import { DividendCoveragePanel } from '@/components/admin/DividendCoveragePanel'

type DerivedRow = {
    stockCode: string
    profitYear: number | null
    grossPerShare: number | null
    cumDate: string | null
    exDate: string | null
    recordDate: string | null
    paymentStart: string | null
    paymentEnd: string | null
    parseStatus: DividendParseStatus
    source: string
}

export function DividendOverridesEditor({
    codes,
    derivedRows,
    initialOverrides,
    coverageReport = null,
}: {
    codes: string[]
    derivedRows: DerivedRow[]
    initialOverrides: DividendOverrideView[]
    coverageReport?: DividendCoverageReport | null
}) {
    const [stockCode, setStockCode] = useState(codes[0] ?? 'TEL')
    const [profitYear, setProfitYear] = useState(String(new Date().getFullYear() - 1))
    const [grossPerShare, setGrossPerShare] = useState('')
    const [cumDate, setCumDate] = useState('')
    const [exDate, setExDate] = useState('')
    const [recordDate, setRecordDate] = useState('')
    const [paymentStart, setPaymentStart] = useState('')
    const [paymentEnd, setPaymentEnd] = useState('')
    const [parseStatus, setParseStatus] = useState<DividendParseStatus>('partial')
    const [message, setMessage] = useState<string | null>(null)
    const [overrides, setOverrides] = useState(initialOverrides)
    const [pending, startTransition] = useTransition()

    const issuerDerived = useMemo(
        () =>
            derivedRows
                .filter((r) => r.stockCode.toUpperCase() === stockCode.toUpperCase())
                .sort((a, b) => (b.profitYear ?? 0) - (a.profitYear ?? 0)),
        [derivedRows, stockCode]
    )

    const loadFromDerived = (row: DerivedRow) => {
        if (row.profitYear != null) setProfitYear(String(row.profitYear))
        setGrossPerShare(row.grossPerShare != null ? String(row.grossPerShare) : '')
        setCumDate(row.cumDate ?? '')
        setExDate(row.exDate ?? '')
        setRecordDate(row.recordDate ?? '')
        setPaymentStart(row.paymentStart ?? '')
        setPaymentEnd(row.paymentEnd ?? '')
        setParseStatus(row.parseStatus)
        setMessage(null)
    }

    const loadFromCoverageGap = (cell: CoverageCell) => {
        setStockCode(cell.stockCode)
        setProfitYear(String(cell.profitYear))
        setGrossPerShare(
            cell.grossPerShare != null
                ? String(cell.grossPerShare)
                : cell.mseDps != null
                  ? String(cell.mseDps)
                  : ''
        )
        setCumDate('')
        setExDate(cell.exDate ?? '')
        setRecordDate('')
        setPaymentStart(cell.paymentStart ?? '')
        setPaymentEnd(cell.paymentEnd ?? '')
        setParseStatus(cell.parseStatus ?? 'partial')
        setMessage(`Loaded gap ${cell.stockCode} ${cell.profitYear} (${cell.kind}) — edit and save.`)
    }

    const onSave = () => {
        setMessage(null)
        startTransition(async () => {
            const result = await upsertDividendOverrideAction({
                stockCode,
                profitYear: Number(profitYear),
                grossPerShare,
                cumDate,
                exDate,
                recordDate,
                paymentStart,
                paymentEnd,
                parseStatus,
            })
            if (!result.ok) {
                setMessage(result.error ?? 'Save failed')
                return
            }
            setMessage('Saved. Run npm run generate:dividends to refresh derived JSON.')
            setOverrides((prev) => {
                const next = prev.filter(
                    (o) =>
                        !(
                            o.stockCode === stockCode.toUpperCase() &&
                            o.profitYear === Number(profitYear)
                        )
                )
                next.push({
                    stockCode: stockCode.toUpperCase(),
                    profitYear: Number(profitYear),
                    fields: {
                        grossPerShare: grossPerShare.trim()
                            ? Number(grossPerShare.replace(',', '.'))
                            : null,
                        cumDate: cumDate.trim() || null,
                        exDate: exDate.trim() || null,
                        recordDate: recordDate.trim() || null,
                        paymentStart: paymentStart.trim() || null,
                        paymentEnd: paymentEnd.trim() || null,
                        parseStatus,
                    },
                    updatedBy: null,
                    updatedAt: new Date().toISOString(),
                })
                return next.sort(
                    (a, b) =>
                        a.stockCode.localeCompare(b.stockCode) || b.profitYear - a.profitYear
                )
            })
        })
    }

    const onDelete = (code: string, year: number) => {
        setMessage(null)
        startTransition(async () => {
            const result = await deleteDividendOverrideAction({
                stockCode: code,
                profitYear: year,
            })
            if (!result.ok) {
                setMessage(result.error ?? 'Delete failed')
                return
            }
            setOverrides((prev) =>
                prev.filter((o) => !(o.stockCode === code && o.profitYear === year))
            )
            setMessage('Override deleted.')
        })
    }

    return (
        <div className="space-y-8">
            <DividendCoveragePanel report={coverageReport} onLoadGap={loadFromCoverageGap} />

            <section className="space-y-4 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <h2
                    className="text-xl font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--talir-serif)', letterSpacing: '-0.015em' }}
                >
                    Edit override
                </h2>
                <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="stockCode">Ticker</Label>
                        <select
                            id="stockCode"
                            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
                            value={stockCode}
                            onChange={(e) => setStockCode(e.target.value)}
                        >
                            {codes.map((c) => (
                                <option key={c} value={c}>
                                    {c}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="profitYear">Profit year</Label>
                        <Input
                            id="profitYear"
                            value={profitYear}
                            onChange={(e) => setProfitYear(e.target.value)}
                            className="font-[family-name:var(--talir-mono)] tabular-nums"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="gross">Gross DPS (ден.)</Label>
                        <Input
                            id="gross"
                            value={grossPerShare}
                            onChange={(e) => setGrossPerShare(e.target.value)}
                            className="font-[family-name:var(--talir-mono)] tabular-nums"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="status">Parse status</Label>
                        <select
                            id="status"
                            className="flex h-10 w-full rounded-md border border-[var(--border)] bg-[var(--surface)] px-3 text-sm text-[var(--text)]"
                            value={parseStatus}
                            onChange={(e) =>
                                setParseStatus(e.target.value as DividendParseStatus)
                            }
                        >
                            <option value="partial">partial</option>
                            <option value="parsed">parsed</option>
                            <option value="link_only">link_only</option>
                        </select>
                    </div>
                    {(
                        [
                            ['cumDate', 'Cum date', cumDate, setCumDate],
                            ['exDate', 'Ex date', exDate, setExDate],
                            ['recordDate', 'Record date', recordDate, setRecordDate],
                            ['paymentStart', 'Pay start', paymentStart, setPaymentStart],
                            ['paymentEnd', 'Pay end', paymentEnd, setPaymentEnd],
                        ] as const
                    ).map(([id, label, value, setter]) => (
                        <div key={id} className="space-y-2">
                            <Label htmlFor={id}>{label} (YYYY-MM-DD)</Label>
                            <Input
                                id={id}
                                value={value}
                                onChange={(e) => setter(e.target.value)}
                                className="font-[family-name:var(--talir-mono)] tabular-nums"
                            />
                        </div>
                    ))}
                </div>
                <div className="flex flex-wrap gap-3">
                    <Button type="button" onClick={onSave} disabled={pending}>
                        {pending ? 'Saving…' : 'Save override'}
                    </Button>
                </div>
                {message && (
                    <p className="text-sm text-[var(--text-muted)]" role="status">
                        {message}
                    </p>
                )}
            </section>

            <section className="space-y-3">
                <h2
                    className="text-xl font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--talir-serif)', letterSpacing: '-0.015em' }}
                >
                    Current derived rows · {stockCode}
                </h2>
                <div className="overflow-x-auto rounded-xl border border-[var(--border)]">
                    <table className="w-full min-w-[640px] text-left text-sm">
                        <thead className="border-b border-[var(--border)] bg-[var(--surface)] font-[family-name:var(--talir-mono)] text-xs uppercase tracking-wider text-[var(--text-muted)]">
                            <tr>
                                <th className="px-3 py-2">PY</th>
                                <th className="px-3 py-2">DPS</th>
                                <th className="px-3 py-2">Ex</th>
                                <th className="px-3 py-2">Status</th>
                                <th className="px-3 py-2">Source</th>
                                <th className="px-3 py-2" />
                            </tr>
                        </thead>
                        <tbody>
                            {issuerDerived.length === 0 && (
                                <tr>
                                    <td
                                        colSpan={6}
                                        className="px-3 py-4 text-[var(--text-muted)]"
                                    >
                                        No derived rows for this ticker.
                                    </td>
                                </tr>
                            )}
                            {issuerDerived.map((row) => (
                                <tr
                                    key={`${row.stockCode}-${row.profitYear}-${row.exDate}`}
                                    className="border-b border-[var(--border)]"
                                >
                                    <td className="px-3 py-2 font-[family-name:var(--talir-mono)] tabular-nums">
                                        {row.profitYear ?? '—'}
                                    </td>
                                    <td className="px-3 py-2 font-[family-name:var(--talir-mono)] tabular-nums">
                                        {row.grossPerShare ?? '—'}
                                    </td>
                                    <td className="px-3 py-2 font-[family-name:var(--talir-mono)] tabular-nums">
                                        {row.exDate ?? '—'}
                                    </td>
                                    <td className="px-3 py-2">{row.parseStatus}</td>
                                    <td className="px-3 py-2">{row.source}</td>
                                    <td className="px-3 py-2">
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => loadFromDerived(row)}
                                        >
                                            Load
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="space-y-3">
                <h2
                    className="text-xl font-bold text-[var(--text)]"
                    style={{ fontFamily: 'var(--talir-serif)', letterSpacing: '-0.015em' }}
                >
                    Saved overrides
                </h2>
                <ul className="space-y-2">
                    {overrides.length === 0 && (
                        <li className="text-sm text-[var(--text-muted)]">No overrides yet.</li>
                    )}
                    {overrides.map((o) => (
                        <li
                            key={`${o.stockCode}-${o.profitYear}`}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
                        >
                            <span className="font-[family-name:var(--talir-mono)] text-sm tabular-nums text-[var(--text)]">
                                {o.stockCode} · {o.profitYear} · DPS{' '}
                                {o.fields.grossPerShare ?? '—'} · {o.fields.exDate ?? 'no ex'}
                            </span>
                            <Button
                                type="button"
                                variant="danger"
                                size="sm"
                                disabled={pending}
                                onClick={() => onDelete(o.stockCode, o.profitYear)}
                            >
                                Delete
                            </Button>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    )
}
