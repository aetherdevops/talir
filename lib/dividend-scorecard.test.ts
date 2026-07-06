import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { DividendCalendarEntry } from './dividends.ts'
import {
    buildDividendScorecard,
    buildYieldAtExSeries,
    classifyPayoutHealth,
    computeDividendStreakYears,
    computeYieldGrowthPct,
    countDisclosedDividends,
    issuerSeinetDisclosuresUrl,
    uniqueParsedByProfitYear,
} from './dividend-scorecard.ts'

function entry(overrides: Partial<DividendCalendarEntry>): DividendCalendarEntry {
    return {
        stockCode: 'KMB',
        stockName: 'Komercijalna banka AD Skopje',
        filedAt: '2026-04-01',
        url: 'https://seinet.com.mk/en/document/1',
        grossPerShare: 1350,
        cumDate: '2026-04-08',
        exDate: '2026-04-09',
        recordDate: null,
        paymentStart: '2026-05-04',
        paymentEnd: null,
        parseStatus: 'parsed',
        trailingYieldAtEx: 5,
        yoyGrowthPct: 8,
        profitYear: 2025,
        payoutRatioPct: 60.1,
        source: 'SECNet',
        ...overrides,
    }
}

describe('classifyPayoutHealth', () => {
    it('bands payout ratio', () => {
        assert.equal(classifyPayoutHealth(45), 'conservative')
        assert.equal(classifyPayoutHealth(75), 'typical')
        assert.equal(classifyPayoutHealth(95), 'stretched')
        assert.equal(classifyPayoutHealth(null), null)
    })
})

describe('computeDividendStreakYears', () => {
    it('counts consecutive profit years from latest', () => {
        const streak = computeDividendStreakYears([
            entry({ profitYear: 2025, filedAt: '2026-04-01' }),
            entry({ profitYear: 2024, filedAt: '2025-04-01', grossPerShare: 1250 }),
            entry({ profitYear: 2023, filedAt: '2024-04-01', grossPerShare: 1150 }),
            entry({ profitYear: 2021, filedAt: '2022-04-01', grossPerShare: 1000 }),
        ])
        assert.equal(streak, 3)
    })
})

describe('buildYieldAtExSeries', () => {
    it('returns yield points by profit year', () => {
        const series = buildYieldAtExSeries([
            entry({ profitYear: 2023, trailingYieldAtEx: 4.2 }),
            entry({ profitYear: 2024, trailingYieldAtEx: 4.8 }),
            entry({ profitYear: 2025, trailingYieldAtEx: 5 }),
        ])
        assert.deepEqual(series, [
            { year: 2023, yieldPct: 4.2 },
            { year: 2024, yieldPct: 4.8 },
            { year: 2025, yieldPct: 5 },
        ])
    })
})

describe('computeYieldGrowthPct', () => {
    it('computes YoY yield change', () => {
        const pct = computeYieldGrowthPct([
            { year: 2024, yieldPct: 4 },
            { year: 2025, yieldPct: 5 },
        ])
        assert.ok(Math.abs(pct! - 25) < 0.001)
    })
})

describe('buildDividendScorecard', () => {
    it('builds glance metrics from calendars and price', () => {
        const scorecard = buildDividendScorecard({
            stockCode: 'KMB',
            currentPrice: 27000,
            firstTradeDate: '2002-01-08',
            entries: [
                entry({ profitYear: 2025, yoyGrowthPct: 8, payoutRatioPct: 60.1 }),
                entry({ profitYear: 2024, filedAt: '2025-04-01', grossPerShare: 1250, yoyGrowthPct: null }),
            ],
        })

        assert.ok(Math.abs(scorecard.trailingYieldPct! - 5) < 0.001)
        assert.equal(scorecard.yoyDpsGrowthPct, 8)
        assert.equal(scorecard.payoutRatioPct, 60.1)
        assert.equal(scorecard.payoutHealth, 'typical')
        assert.equal(scorecard.dividendStreakYears, 2)
        assert.equal(scorecard.disclosedDividendCount, 2)
        assert.equal(scorecard.seinetSourceUrl, issuerSeinetDisclosuresUrl('KMB'))
    })
})

describe('countDisclosedDividends', () => {
    it('dedupes by profit year and respects listing date', () => {
        const count = countDisclosedDividends(
            [
                entry({ profitYear: 2025, exDate: '2026-04-09' }),
                entry({ profitYear: 2024, exDate: '2025-04-09', filedAt: '2025-04-01' }),
                entry({
                    profitYear: 2018,
                    exDate: '2019-04-09',
                    filedAt: '2019-04-01',
                    grossPerShare: 900,
                }),
            ],
            '2020-01-01'
        )
        assert.equal(count, 2)
    })
})

describe('uniqueParsedByProfitYear', () => {
    it('keeps newest filing per profit year', () => {
        const rows = uniqueParsedByProfitYear([
            entry({ profitYear: 2025, filedAt: '2026-03-01', grossPerShare: 1000 }),
            entry({ profitYear: 2025, filedAt: '2026-04-01', grossPerShare: 1350 }),
        ])
        assert.equal(rows.length, 1)
        assert.equal(rows[0]!.grossPerShare, 1350)
    })
})
