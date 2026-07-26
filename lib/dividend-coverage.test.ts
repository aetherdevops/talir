import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    buildCoverageReport,
    classifyCoverageCell,
} from './dividend-coverage.ts'
import type { DividendCalendarEntry } from './dividends.ts'

function entry(partial: Partial<DividendCalendarEntry>): DividendCalendarEntry {
    return {
        stockCode: 'TEL',
        stockName: 'Telecom',
        filedAt: '2026-05-01',
        url: 'https://seinet.com.mk/document/1',
        grossPerShare: null,
        cumDate: null,
        exDate: null,
        recordDate: null,
        paymentStart: null,
        paymentEnd: null,
        parseStatus: 'link_only',
        source: 'SECNet',
        trailingYieldAtEx: null,
        yoyGrowthPct: null,
        profitYear: 2025,
        payoutRatioPct: null,
        ...partial,
    }
}

describe('classifyCoverageCell', () => {
    it('marks MSE synthetic rows as mse_only', () => {
        const cell = classifyCoverageCell({
            stockCode: 'TEL',
            profitYear: 2024,
            entry: entry({
                source: 'MSE',
                parseStatus: 'partial',
                grossPerShare: 28.93,
                profitYear: 2024,
                url: 'https://www.mse.mk/en/symbol/TEL#fy-2024',
                isSynthetic: true,
            }),
            mseDps: 28.93,
            hasOverride: false,
            hasSeinetDocument: false,
        })
        assert.equal(cell.kind, 'mse_only')
    })

    it('keeps SECNet partial with MSE-filled DPS as partial not mse_only', () => {
        const cell = classifyCoverageCell({
            stockCode: 'TEL',
            profitYear: 2025,
            entry: entry({
                source: 'SECNet',
                parseStatus: 'partial',
                grossPerShare: 28.93,
                exDate: '2026-07-02',
                cumDate: '2026-07-01',
                profitYear: 2025,
                sourceFields: { grossPerShare: 'MSE' },
            }),
            mseDps: 28.93,
            hasOverride: false,
            hasSeinetDocument: true,
        })
        assert.equal(cell.kind, 'partial')
    })

    it('marks overrides highest', () => {
        const cell = classifyCoverageCell({
            stockCode: 'TEL',
            profitYear: 2024,
            entry: entry({ parseStatus: 'parsed', grossPerShare: 10, profitYear: 2024 }),
            mseDps: 10,
            hasOverride: true,
            hasSeinetDocument: true,
        })
        assert.equal(cell.kind, 'override')
    })

    it('marks DPS-only partial distinctly', () => {
        const cell = classifyCoverageCell({
            stockCode: 'ALK',
            profitYear: 2023,
            entry: entry({
                stockCode: 'ALK',
                parseStatus: 'partial',
                grossPerShare: 720,
                profitYear: 2023,
            }),
            mseDps: 720,
            hasOverride: false,
            hasSeinetDocument: true,
        })
        assert.equal(cell.kind, 'partial_dps_only')
    })
})

describe('buildCoverageReport', () => {
    it('builds matrix from entries + MSE years', () => {
        const report = buildCoverageReport({
            entries: [
                entry({
                    parseStatus: 'parsed',
                    grossPerShare: 28.93,
                    exDate: '2026-07-02',
                    cumDate: '2026-07-01',
                    paymentEnd: '2026-09-30',
                    profitYear: 2025,
                }),
            ],
            mseRatios: {
                generatedAt: '2026-01-01',
                byCode: {
                    TEL: {
                        years: {
                            '2024': { dps: 17.1, eps: 30, dividendYieldPct: 2 },
                            '2025': { dps: 28.93, eps: 40, dividendYieldPct: 3 },
                        },
                    },
                },
            },
            overrides: new Set(),
            seinetDocs: new Set(['TEL::2025']),
            parserVersion: '1.5.0',
        })

        assert.equal(report.summary.totalCells, 2)
        assert.ok(report.summary.parsed >= 1)
        assert.ok(report.gaps.some((g) => g.kind === 'mse_only' && g.profitYear === 2024))
    })
})
