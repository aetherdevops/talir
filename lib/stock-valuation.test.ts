import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { DividendCalendarEntry } from './dividends.ts'
import type { FundamentalEntry } from './fundamentals.ts'
import {
    buildStockValuationSnapshot,
    computeEarningsYieldPct,
    computePeRatio,
    computeTrailingDividendYieldPct,
    pickLatestFundamental,
} from './stock-valuation.ts'

function fundamental(overrides: Partial<FundamentalEntry>): FundamentalEntry {
    return {
        stockCode: 'KMB',
        stockName: 'Komercijalna banka AD Skopje',
        fiscalYear: 2024,
        filedAt: '2025-04-03',
        url: 'https://seinet.com.mk/en/document/71769',
        netProfit: 4960114,
        eps: 2171,
        parseStatus: 'parsed',
        source: 'SECNet',
        ...overrides,
    }
}

function dividend(overrides: Partial<DividendCalendarEntry>): DividendCalendarEntry {
    return {
        stockCode: 'KMB',
        stockName: 'Komercijalna banka AD Skopje',
        filedAt: '2026-03-27',
        url: 'https://seinet.com.mk/en/document/75995',
        grossPerShare: 1350,
        cumDate: '2026-04-08',
        exDate: '2026-04-09',
        recordDate: '2026-04-14',
        paymentStart: '2026-05-04',
        paymentEnd: null,
        parseStatus: 'parsed',
        trailingYieldAtEx: null,
        yoyGrowthPct: null,
        profitYear: 2025,
        payoutRatioPct: 60.13,
        source: 'SECNet',
        ...overrides,
    }
}

describe('pickLatestFundamental', () => {
    it('prefers parsed over partial for same fiscal year', () => {
        const picked = pickLatestFundamental([
            fundamental({ parseStatus: 'partial', eps: null, filedAt: '2025-04-04' }),
            fundamental({ parseStatus: 'parsed', eps: 2171, filedAt: '2025-04-03' }),
        ])
        assert.equal(picked?.parseStatus, 'parsed')
        assert.equal(picked?.eps, 2171)
    })

    it('returns highest fiscal year', () => {
        const picked = pickLatestFundamental([
            fundamental({ fiscalYear: 2023, eps: 500 }),
            fundamental({ fiscalYear: 2024, eps: 2171 }),
        ])
        assert.equal(picked?.fiscalYear, 2024)
    })
})

describe('computePeRatio', () => {
    it('computes price over EPS', () => {
        assert.ok(Math.abs(computePeRatio(27000, 2171)! - 12.436667) < 0.001)
    })

    it('returns null for missing EPS', () => {
        assert.equal(computePeRatio(27000, null), null)
    })
})

describe('computeTrailingDividendYieldPct', () => {
    it('computes gross over price', () => {
        assert.ok(Math.abs(computeTrailingDividendYieldPct(27000, 1350)! - 5) < 0.001)
    })
})

describe('computeEarningsYieldPct', () => {
    it('computes EPS over price', () => {
        assert.ok(Math.abs(computeEarningsYieldPct(27000, 2171)! - 8.0407) < 0.01)
    })
})

describe('buildStockValuationSnapshot', () => {
    it('builds full snapshot for KMB-like inputs', () => {
        const snapshot = buildStockValuationSnapshot({
            price: 27000,
            fundamentals: [fundamental({})],
            dividends: [dividend({})],
        })

        assert.equal(snapshot.eps, 2171)
        assert.equal(snapshot.grossPerShare, 1350)
        assert.equal(snapshot.payoutRatioPct, 60.13)
        assert.ok(snapshot.peRatio !== null)
        assert.ok(snapshot.dividendYieldPct !== null)
        assert.equal(snapshot.hasAnyFundamentals, true)
    })

    it('falls back payout ratio from EPS join when not precomputed', () => {
        const snapshot = buildStockValuationSnapshot({
            price: 27000,
            fundamentals: [
                fundamental({ fiscalYear: 2025, eps: 2000, filedAt: '2026-03-30' }),
            ],
            dividends: [
                dividend({
                    profitYear: 2025,
                    payoutRatioPct: null,
                    grossPerShare: 1000,
                }),
            ],
        })

        assert.equal(snapshot.payoutRatioPct, 50)
    })

    it('returns net profit only for partial fundamentals', () => {
        const snapshot = buildStockValuationSnapshot({
            price: 12000,
            fundamentals: [
                fundamental({
                    stockCode: 'ALK',
                    parseStatus: 'partial',
                    eps: null,
                    netProfit: 1984231,
                }),
            ],
            dividends: [],
        })

        assert.equal(snapshot.netProfit, 1984231)
        assert.equal(snapshot.eps, null)
        assert.equal(snapshot.peRatio, null)
        assert.equal(snapshot.hasAnyFundamentals, true)
    })

    it('returns empty snapshot when no data', () => {
        const snapshot = buildStockValuationSnapshot({
            price: 1000,
            fundamentals: [],
            dividends: [],
        })

        assert.equal(snapshot.hasAnyFundamentals, false)
    })
})
