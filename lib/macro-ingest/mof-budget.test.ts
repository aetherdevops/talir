import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { fetchMofBudgetBalanceGdp } from './mof-budget.ts'

describe('mof budget balance', () => {
    it('fetches quarterly YTD balance/GDP points from MoF Statistical Review', async () => {
        const result = await fetchMofBudgetBalanceGdp()
        assert.ok(result.points.length > 20, result.note)
        const last = result.points[result.points.length - 1]!
        assert.match(last.date, /^\d{4}-\d{2}-01$/)
        assert.ok(Number.isFinite(last.value))
        // Deficit is typical for MK central budget YTD
        assert.ok(last.value < 5 && last.value > -15, `unexpected last value ${last.value}`)
    })
})
