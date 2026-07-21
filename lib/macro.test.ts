import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
    changeVsPrior,
    changeVsYearAgo,
    formatMacroDelta,
    formatMacroValue,
    latestPoint,
    priorBaselineLabel,
    priorPoint,
    sliceByRange,
    yoySeries,
    type MacroPoint,
} from './macro.ts'

const monthly: MacroPoint[] = [
    { date: '2024-01-01', value: 10 },
    { date: '2024-02-01', value: 10.5 },
    { date: '2025-01-01', value: 11 },
    { date: '2025-02-01', value: 11.2 },
    { date: '2026-01-01', value: 12 },
    { date: '2026-02-01', value: 12.4 },
]

describe('macro time helpers', () => {
    it('latest and prior points', () => {
        assert.equal(latestPoint(monthly)?.date, '2026-02-01')
        assert.equal(priorPoint(monthly)?.value, 12)
    })

    it('change vs prior with brand-neutral near zero', () => {
        const d = changeVsPrior([
            { date: '2026-01-01', value: 2 },
            { date: '2026-02-01', value: 2.004 },
        ])
        assert.ok(d)
        assert.equal(d!.kind, 'neutral')
    })

    it('change vs year ago matches same month', () => {
        const d = changeVsYearAgo(monthly)
        assert.ok(d)
        assert.ok(Math.abs(d!.absolute - 1.2) < 1e-9) // 12.4 - 11.2
        assert.equal(d!.baseline, 'year_ago')
        assert.equal(d!.kind, 'up')
    })

    it('sliceByRange keeps trailing window', () => {
        const sliced = sliceByRange(monthly, '1Y')
        assert.ok(sliced[0]!.date >= '2025-02-01')
        assert.equal(sliceByRange(monthly, 'max').length, monthly.length)
    })

    it('yoySeries emits year-over-year deltas', () => {
        const yoy = yoySeries(monthly)
        const feb = yoy.find((p) => p.date === '2026-02-01')
        assert.ok(Math.abs((feb?.value ?? 0) - 1.2) < 1e-9)
    })

    it('formats values and deltas', () => {
        assert.equal(formatMacroValue(12.4, '%'), '12.4%')
        assert.equal(
            formatMacroDelta({ absolute: 0.3, kind: 'up', baseline: 'prior' }, 'pp'),
            '+0.3 pp'
        )
        assert.equal(
            formatMacroDelta({ absolute: -0.3, kind: 'down', baseline: 'prior' }, 'pp'),
            '−0.3 pp'
        )
        assert.equal(priorBaselineLabel('monthly', 'prior'), 'vsPriorMonth')
        assert.equal(priorBaselineLabel('quarterly', 'year_ago'), 'vsYearAgo')
    })
})
