import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import type { DividendCalendarEntry } from './dividends.ts'
import type { FundamentalEntry } from './fundamentals.ts'
import {
    applyDividendOverrides,
    applyMseDividendRatios,
    applyMseFundamentalsEps,
    parseMseRatioNumber,
    parseMseSymbolRatiosHtml,
    type MseSymbolRatiosFile,
} from './mse-symbol-ratios.ts'

const TEL_RATIOS_HTML = `
<html><body>
<table>
  <tr><td>Year</td><td>2025</td><td>2024</td><td>2023</td></tr>
  <tr><td>Return on sales</td><td>22.95%</td><td>20.24%</td><td>19.65%</td></tr>
  <tr><td>Net earnings per share (EPS)</td><td>26.45</td><td>23.36</td><td>21.71</td></tr>
  <tr><td>Dividend Per Share</td><td>28.93</td><td>27.62</td><td>25.65</td></tr>
  <tr><td>Dividend yield</td><td>6.29%</td><td>6.91%</td><td>6.68%</td></tr>
</table>
</body></html>
`

function blankDividend(
    partial: Partial<DividendCalendarEntry> & Pick<DividendCalendarEntry, 'stockCode' | 'filedAt' | 'url'>
): DividendCalendarEntry {
    return {
        stockName: partial.stockName ?? partial.stockCode,
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
        profitYear: null,
        payoutRatioPct: null,
        ...partial,
    }
}

describe('parseMseRatioNumber', () => {
    it('parses DPS, EPS, and percent yields', () => {
        assert.equal(parseMseRatioNumber('28.93'), 28.93)
        assert.equal(parseMseRatioNumber('12,531,346'), 12531346)
        assert.equal(parseMseRatioNumber('6.29%'), 6.29)
        assert.equal(parseMseRatioNumber('-'), null)
    })
})

describe('parseMseSymbolRatiosHtml', () => {
    it('parses TEL-like Fin.Ratios table', () => {
        const years = parseMseSymbolRatiosHtml(TEL_RATIOS_HTML)
        assert.equal(years['2025']?.dps, 28.93)
        assert.equal(years['2024']?.dps, 27.62)
        assert.equal(years['2023']?.dps, 25.65)
        assert.equal(years['2025']?.eps, 26.45)
        assert.equal(years['2025']?.dividendYieldPct, 6.29)
    })
})

describe('applyMseDividendRatios', () => {
    const ratios: MseSymbolRatiosFile = {
        generatedAt: '2026-07-13T00:00:00.000Z',
        byCode: {
            TEL: {
                years: {
                    '2025': { dps: 28.93, eps: 26.45, dividendYieldPct: 6.29 },
                    '2024': { dps: 27.62, eps: 23.36, dividendYieldPct: 6.91 },
                },
            },
        },
    }

    it('does not overwrite SECnet gross', () => {
        const entries = [
            blankDividend({
                stockCode: 'TEL',
                filedAt: '2026-05-27',
                url: 'https://seinet.com.mk/en/document/77506',
                grossPerShare: 28.9250940552,
                profitYear: 2025,
                parseStatus: 'partial',
                source: 'SECNet',
            }),
        ]
        const { filled, created } = applyMseDividendRatios(entries, ratios)
        assert.equal(filled, 0)
        assert.equal(created, 1) // 2024 only
        assert.equal(entries[0].grossPerShare, 28.9250940552)
        assert.equal(entries[0].source, 'SECNet')
    })

    it('fills null gross and creates synthetic rows', () => {
        const entries = [
            blankDividend({
                stockCode: 'TEL',
                filedAt: '2026-05-27',
                url: 'https://seinet.com.mk/en/document/77506',
                profitYear: 2025,
                cumDate: '2026-07-01',
                exDate: '2026-07-02',
            }),
        ]
        const { filled, created } = applyMseDividendRatios(entries, ratios)
        assert.equal(filled, 1)
        assert.equal(created, 1)
        assert.equal(entries[0].grossPerShare, 28.93)
        assert.equal(entries[0].source, 'SECNet')
        assert.equal(entries[0].sourceFields?.grossPerShare, 'MSE')
        assert.equal(entries[0].parseStatus, 'partial')
        assert.equal(entries[0].cumDate, '2026-07-01')
        const synthetic = entries.find((e) => e.profitYear === 2024)
        assert.ok(synthetic)
        assert.equal(synthetic!.grossPerShare, 27.62)
        assert.equal(synthetic!.source, 'MSE')
        assert.equal(synthetic!.isSynthetic, true)
    })
})

describe('applyMseFundamentalsEps', () => {
    it('fills missing EPS without clobbering existing', () => {
        const ratios: MseSymbolRatiosFile = {
            generatedAt: '2026-07-13T00:00:00.000Z',
            byCode: {
                TEL: {
                    years: {
                        '2025': { dps: 28.93, eps: 26.45, dividendYieldPct: null },
                        '2024': { dps: 27.62, eps: 23.36, dividendYieldPct: null },
                    },
                },
            },
        }
        const entries: FundamentalEntry[] = [
            {
                stockCode: 'TEL',
                stockName: 'TEL',
                fiscalYear: 2025,
                filedAt: '2026-05-27',
                url: 'https://seinet.com.mk/en/document/1',
                netProfit: null,
                eps: 26.451,
                parseStatus: 'parsed',
                source: 'SECNet',
            },
        ]
        const { filled, created } = applyMseFundamentalsEps(entries, ratios)
        assert.equal(filled, 0)
        assert.equal(created, 1)
        assert.equal(entries[0].eps, 26.451)
        assert.equal(entries[0].source, 'SECNet')
    })
})

describe('applyDividendOverrides', () => {
    it('overrides gross and marks source manual', () => {
        const entries = [
            blankDividend({
                stockCode: 'STB',
                filedAt: '2025-06-02',
                url: 'https://seinet.com.mk/en/document/1',
                grossPerShare: 400,
                profitYear: 2024,
                parseStatus: 'partial',
            }),
        ]
        const applied = applyDividendOverrides(entries, [
            {
                stock_code: 'STB',
                profit_year: 2024,
                fields: { grossPerShare: 6, cumDate: '2025-06-12', exDate: '2025-06-13' },
            },
        ])
        assert.equal(applied, 1)
        assert.equal(entries[0].grossPerShare, 6)
        assert.equal(entries[0].cumDate, '2025-06-12')
        assert.equal(entries[0].source, 'manual')
    })
})
