import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import test from 'node:test'

import {
    adjustHistoryForSplits,
    adjustStockHistory,
    detectSplitCandidates,
    formatRatio,
    getAllStockSplits,
    getStockSplits,
    splitAdjustmentFactor,
    type StockSplit,
} from './corporate-actions'
import type { DailyPrice } from './types'

function row(overrides: Partial<DailyPrice> & { date: string }): DailyPrice {
    return {
        last_transaction_price: 1000,
        max_price: 1000,
        min_price: 1000,
        average_price: 1000,
        percent_change: 0,
        quantity: 10,
        turnover_best_mkd: 10000,
        total_turnover_mkd: 10000,
        ...overrides,
    }
}

const tenForOne: StockSplit = {
    code: 'TEST',
    effectiveDate: '2024-07-15',
    ratio: 10,
    kind: 'split',
    confidence: 'confirmed',
}

function loadHistory(code: string): DailyPrice[] {
    const filePath = path.join(process.cwd(), 'lib', 'data', 'stocks', `${code}.json`)
    const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as { history?: DailyPrice[] }
    return raw.history ?? []
}

test('splitAdjustmentFactor compounds only splits after the date', () => {
    const splits: StockSplit[] = [
        { ...tenForOne, effectiveDate: '2010-01-04', ratio: 5 },
        { ...tenForOne, effectiveDate: '2024-07-15', ratio: 10 },
    ]

    assert.equal(splitAdjustmentFactor(splits, '2009-12-31'), 50)
    assert.equal(splitAdjustmentFactor(splits, '2010-01-04'), 10)
    assert.equal(splitAdjustmentFactor(splits, '2024-07-14'), 10)
    assert.equal(splitAdjustmentFactor(splits, '2024-07-15'), 1)
    assert.equal(splitAdjustmentFactor([], '2024-07-15'), 1)
})

test('adjustHistoryForSplits rebases prices and share counts, leaving money alone', () => {
    const history = [
        row({ date: '2024-07-12', last_transaction_price: 125000, average_price: 125000, quantity: 5, total_turnover_mkd: 625000 }),
        row({ date: '2024-07-15', last_transaction_price: 13750, average_price: 13750, quantity: 313, total_turnover_mkd: 4303750 }),
    ]

    const adjusted = adjustHistoryForSplits(history, [tenForOne])

    assert.equal(adjusted[0].last_transaction_price, 12500)
    assert.equal(adjusted[0].average_price, 12500)
    assert.equal(adjusted[0].quantity, 50)
    assert.equal(adjusted[0].total_turnover_mkd, 625000, 'a split moves no money')

    assert.equal(adjusted[1].last_transaction_price, 13750, 'post-split rows are untouched')
    assert.equal(adjusted[1].quantity, 313)
})

test('adjustHistoryForSplits replaces the meaningless percent change on the effective date', () => {
    const history = [
        row({ date: '2005-03-23', last_transaction_price: 8900, average_price: 8900 }),
        row({ date: '2005-03-28', last_transaction_price: 2000, average_price: 1985.18, percent_change: -78.18 }),
    ]

    const adjusted = adjustHistoryForSplits(history, [
        { ...tenForOne, effectiveDate: '2005-03-28', ratio: 5 },
    ])

    // 8900 / 5 = 1780 -> 2000 is a 12.36% gain, not the -78.18% MSE printed.
    assert.ok(Math.abs(adjusted[1].percent_change - 12.3595) < 0.001)
})

test('adjustHistoryForSplits returns the input untouched when there is nothing to adjust', () => {
    const history = [row({ date: '2026-01-05' })]
    assert.equal(adjustHistoryForSplits(history, []), history)
})

test('null highs and lows on no-trade rows survive adjustment', () => {
    const adjusted = adjustHistoryForSplits(
        [row({ date: '2024-07-12', max_price: null, min_price: null, quantity: 0 })],
        [tenForOne]
    )
    assert.equal(adjusted[0].max_price, null)
    assert.equal(adjusted[0].min_price, null)
    assert.equal(adjusted[0].quantity, 0)
})

test('formatRatio reads the way the exchange writes it', () => {
    assert.equal(formatRatio(10), '1:10')
    assert.equal(formatRatio(5), '1:5')
    assert.equal(formatRatio(0.2), '5:1')
})

test('registry only exposes confirmed splits, oldest first', () => {
    const all = getAllStockSplits()
    assert.ok(all.length > 0)
    assert.ok(all.every((s) => s.ratio > 0 && /^\d{4}-\d{2}-\d{2}$/.test(s.effectiveDate)))

    const kmb = getStockSplits('KMB')
    assert.equal(kmb.length, 1)
    assert.equal(kmb[0].ratio, 5)
    assert.equal(kmb[0].effectiveDate, '2005-03-28')

    assert.deepEqual(getStockSplits('ALK'), [])
})

test("detects REPL's 1:10 split from MSE's own rebased reference price", () => {
    const candidates = detectSplitCandidates('REPL', loadHistory('REPL'), { knownSplits: [] })
    const split = candidates.find((c) => c.effectiveDate === '2024-07-15')

    assert.ok(split, 'expected the 2024-07-15 split to be detected')
    assert.equal(split.ratio, 10)
    assert.equal(split.kind, 'split')
    assert.equal(split.confidence, 'confirmed')
})

test("detects KMB's 5:1 split from the price gap MSE never rebased", () => {
    const candidates = detectSplitCandidates('KMB', loadHistory('KMB'), { knownSplits: [] })
    const split = candidates.find((c) => c.effectiveDate === '2005-03-28')

    assert.ok(split, 'expected the 2005-03-28 split to be detected')
    assert.equal(split.ratio, 5)
    assert.equal(split.confidence, 'unconfirmed', 'a raw gap always needs a human check')
})

test('splits already in the registry are not reported again', () => {
    for (const code of ['KMB', 'REPL']) {
        const candidates = detectSplitCandidates(code, loadHistory(code), {
            knownSplits: getAllStockSplits(),
        })
        const known = getStockSplits(code).map((s) => s.effectiveDate)
        for (const date of known) {
            assert.ok(
                !candidates.some((c) => c.effectiveDate === date),
                `${code} ${date} should be suppressed`
            )
        }
    }
})

test('illiquid tickers that bounce back are not reported as splits', () => {
    // UNI printed -75% on 2006-02-01 (1000 -> 250) then traded at 650 within months.
    const candidates = detectSplitCandidates('UNI', loadHistory('UNI'), { knownSplits: [] })
    assert.ok(!candidates.some((c) => c.effectiveDate === '2006-02-01'))
})

test('carry-forward rows with no trade are never treated as price events', () => {
    // TNB carries a 3613.24 print on zero volume next to a 1604 close.
    const candidates = detectSplitCandidates('TNB', loadHistory('TNB'), { knownSplits: [] })
    assert.deepEqual(candidates, [])
})

test('the since window keeps the daily run focused on new events', () => {
    const history = loadHistory('REPL')
    assert.ok(
        detectSplitCandidates('REPL', history, { knownSplits: [], since: '2024-01-01' }).length > 0
    )
    assert.deepEqual(
        detectSplitCandidates('REPL', history, { knownSplits: [], since: '2025-01-01' }),
        []
    )
})

test('adjusted MBI10 history has no unexplained overnight jumps left', () => {
    for (const code of ['ALK', 'GRNT', 'KMB', 'MPT', 'REPL', 'STB', 'TEL', 'TNB', 'TTK', 'UNI']) {
        const adjusted = adjustStockHistory(code, loadHistory(code))
        const traded = adjusted.filter((r) => r.quantity > 0 && r.last_transaction_price > 0)

        for (let i = 1; i < traded.length; i++) {
            const gapDays =
                (Date.parse(traded[i].date) - Date.parse(traded[i - 1].date)) / 86_400_000
            if (gapDays > 10) continue

            const ratio = traded[i - 1].last_transaction_price / traded[i].last_transaction_price
            assert.ok(
                ratio < 4 && ratio > 0.25,
                `${code} still jumps ${ratio.toFixed(2)}x between ${traded[i - 1].date} and ${traded[i].date}`
            )
        }
    }
})
