import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { pointsFromJsonStat } from './pxweb.ts'

describe('pxweb pointsFromJsonStat', () => {
    it('parses monthly CPI-style json-stat2 and applies indexMinus100', () => {
        const data = {
            id: ['Месец', 'Базен период', 'Главни COICOP групи'],
            size: [2, 1, 1],
            value: [103.2, 101.5],
            dimension: {
                Месец: {
                    category: {
                        index: { '2025M01': 0, '2025M02': 1 },
                        label: { '2025M01': '2025M01', '2025M02': '2025M02' },
                    },
                },
                'Базен период': {
                    category: { index: { '03': 0 }, label: { '03': 'YoY' } },
                },
                'Главни COICOP групи': {
                    category: { index: { '001': 0 }, label: { '001': 'Total' } },
                },
            },
        }
        const points = pointsFromJsonStat(data as never, 'indexMinus100', 'Месец')
        assert.equal(points.length, 2)
        assert.equal(points[0]!.date, '2025-01-01')
        assert.ok(Math.abs(points[0]!.value - 3.2) < 1e-9)
        assert.equal(points[1]!.date, '2025-02-01')
        assert.ok(Math.abs(points[1]!.value - 1.5) < 1e-9)
    })
})
