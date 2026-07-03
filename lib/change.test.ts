import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    CHANGE_ZERO_THRESHOLD,
    classifyChangePercent,
    formatPriceChange,
} from './utils.ts'
import { rankTopGainers, rankTopLosers } from './data.ts'
import type { StockSummary } from './types.ts'

describe('formatPriceChange', () => {
    const cases: Array<{ pct: number; expected: string }> = [
        { pct: 0.004, expected: '0.00%' },
        { pct: -0.004, expected: '0.00%' },
        { pct: 0, expected: '0.00%' },
        { pct: 0.005, expected: '+0.01%' },
        { pct: -0.005, expected: '−0.01%' },
        { pct: 1.25, expected: '+1.25%' },
        { pct: -2.5, expected: '−2.50%' },
    ]

    for (const { pct, expected } of cases) {
        it(`formats ${pct} as ${expected}`, () => {
            assert.equal(formatPriceChange(pct), expected)
        })
    }

    it('never emits signed zero', () => {
        assert.equal(formatPriceChange(0.004), '0.00%')
        assert.equal(formatPriceChange(-0.004), '0.00%')
        assert.doesNotMatch(formatPriceChange(0.004), /^[+\-−]/)
        assert.doesNotMatch(formatPriceChange(-0.004), /^[+\-−]/)
    })
})

describe('classifyChangePercent (ChangeLabel threshold)', () => {
    it('uses CHANGE_ZERO_THRESHOLD of 0.005', () => {
        assert.equal(CHANGE_ZERO_THRESHOLD, 0.005)
    })

    const cases: Array<{ pct: number; expected: 'up' | 'down' | 'neutral' }> = [
        { pct: 0.004, expected: 'neutral' },
        { pct: -0.004, expected: 'neutral' },
        { pct: 0, expected: 'neutral' },
        { pct: 0.005, expected: 'up' },
        { pct: -0.005, expected: 'down' },
    ]

    for (const { pct, expected } of cases) {
        it(`classifies ${pct} as ${expected}`, () => {
            assert.equal(classifyChangePercent(pct), expected)
        })
    }
})

describe('rankTopGainers / rankTopLosers', () => {
    const stocks: StockSummary[] = [
        { code: 'A', name: 'A', price: 10, change: 0, changePercent: 0, volume: 0, turnover: 0, date: '2026-01-01', type: 'Stock' },
        { code: 'B', name: 'B', price: 10, change: 0, changePercent: 0.004, volume: 0, turnover: 0, date: '2026-01-01', type: 'Stock' },
        { code: 'C', name: 'C', price: 10, change: 0, changePercent: 0.005, volume: 0, turnover: 0, date: '2026-01-01', type: 'Stock' },
        { code: 'D', name: 'D', price: 10, change: 0, changePercent: 2, volume: 0, turnover: 0, date: '2026-01-01', type: 'Stock' },
        { code: 'E', name: 'E', price: 10, change: 0, changePercent: -0.004, volume: 0, turnover: 0, date: '2026-01-01', type: 'Stock' },
        { code: 'F', name: 'F', price: 10, change: 0, changePercent: -0.005, volume: 0, turnover: 0, date: '2026-01-01', type: 'Stock' },
        { code: 'G', name: 'G', price: 10, change: 0, changePercent: -3, volume: 0, turnover: 0, date: '2026-01-01', type: 'Stock' },
    ]

    it('excludes zero-change instruments from gainers', () => {
        const gainers = rankTopGainers(stocks, 5)
        assert.deepEqual(
            gainers.map((s) => s.code),
            ['D', 'C']
        )
    })

    it('excludes zero-change instruments from losers', () => {
        const losers = rankTopLosers(stocks, 5)
        assert.deepEqual(
            losers.map((s) => s.code),
            ['G', 'F']
        )
    })
})
