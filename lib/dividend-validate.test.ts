import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { DividendCalendarEntry } from './dividends.ts'
import { validateDividendEntries } from './dividend-validate.ts'

function entry(overrides: Partial<DividendCalendarEntry>): DividendCalendarEntry {
    return {
        stockCode: 'RADE',
        stockName: 'Rade Konchar',
        filedAt: '2026-06-25',
        url: 'https://seinet.com.mk/en/document/77820',
        grossPerShare: 130,
        cumDate: '2026-07-07',
        exDate: '2026-07-07',
        recordDate: null,
        paymentStart: null,
        paymentEnd: null,
        parseStatus: 'partial',
        source: 'SECNet',
        trailingYieldAtEx: null,
        yoyGrowthPct: null,
        profitYear: null,
        payoutRatioPct: null,
        ...overrides,
    }
}

describe('validateDividendEntries', () => {
    it('clears cum when ex equals cum (RADE-style)', () => {
        const rows = [entry({})]
        const report = validateDividendEntries(rows)
        assert.equal(rows[0]!.cumDate, null)
        assert.equal(rows[0]!.exDate, '2026-07-07')
        assert.ok(report.issues.some((i) => i.kind === 'ex_not_after_cum'))
    })

    it('clears record before ex', () => {
        const rows = [
            entry({
                cumDate: '2026-07-06',
                exDate: '2026-07-07',
                recordDate: '2026-07-01',
            }),
        ]
        validateDividendEntries(rows)
        assert.equal(rows[0]!.recordDate, null)
        assert.equal(rows[0]!.exDate, '2026-07-07')
    })

    it('clears paymentStart before ex', () => {
        const rows = [
            entry({
                cumDate: '2026-07-06',
                exDate: '2026-07-07',
                paymentStart: '2026-06-01',
            }),
        ]
        validateDividendEntries(rows)
        assert.equal(rows[0]!.paymentStart, null)
    })

    it('clears profitYear after ex year', () => {
        const rows = [
            entry({
                cumDate: '2026-07-06',
                exDate: '2026-07-07',
                profitYear: 2027,
            }),
        ]
        validateDividendEntries(rows)
        assert.equal(rows[0]!.profitYear, null)
    })

    it('logs MSE DPS mismatch without clearing gross', () => {
        const rows = [
            entry({
                stockCode: 'ALK',
                cumDate: '2026-04-15',
                exDate: '2026-04-16',
                grossPerShare: 999,
                profitYear: 2025,
            }),
        ]
        const report = validateDividendEntries(rows, {
            mseRatios: {
                generatedAt: '2026-01-01',
                byCode: {
                    ALK: { years: { '2025': { dps: 720, eps: null, dividendYieldPct: null } } },
                },
            },
        })
        assert.equal(rows[0]!.grossPerShare, 999)
        assert.ok(report.issues.some((i) => i.kind === 'mse_dps_mismatch'))
    })
})
