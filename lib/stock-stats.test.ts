import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import type { DailyPrice } from './types.ts'
import { computeAvgVolume, computePrevClose, computeYearRange } from './stock-stats.ts'

function row(overrides: Partial<DailyPrice>): DailyPrice {
    return {
        date: '2026-01-01',
        last_transaction_price: 1000,
        max_price: 1010,
        min_price: 990,
        average_price: 1000,
        percent_change: 0,
        quantity: 100,
        turnover_best_mkd: 100000,
        total_turnover_mkd: 100000,
        ...overrides,
    }
}

describe('computePrevClose', () => {
    it('returns second-to-last close', () => {
        const history = [
            row({ date: '2026-01-01', last_transaction_price: 900 }),
            row({ date: '2026-01-02', last_transaction_price: 950 }),
            row({ date: '2026-01-03', last_transaction_price: 1000 }),
        ]
        assert.equal(computePrevClose(history), 950)
    })

    it('returns null with fewer than two rows', () => {
        assert.equal(computePrevClose([row({})]), null)
        assert.equal(computePrevClose([]), null)
    })
})

describe('computeAvgVolume', () => {
    it('averages last N sessions with volume', () => {
        const history = [
            row({ quantity: 0 }),
            row({ quantity: 100 }),
            row({ quantity: 200 }),
            row({ quantity: 300 }),
        ]
        assert.equal(computeAvgVolume(history, 2), 250)
    })

    it('returns null when no volume rows', () => {
        assert.equal(computeAvgVolume([row({ quantity: 0 }), row({ quantity: 0 })]), null)
    })
})

describe('computeYearRange', () => {
    it('returns min and max within trailing year', () => {
        const now = new Date()
        const recent = now.toISOString().slice(0, 10)
        const old = new Date(now)
        old.setFullYear(old.getFullYear() - 2)
        const oldDate = old.toISOString().slice(0, 10)

        const range = computeYearRange([
            { time: oldDate, value: 50 },
            { time: recent, value: 120 },
            { time: recent, value: 80 },
        ])

        assert.equal(range.low, 80)
        assert.equal(range.high, 120)
    })
})
