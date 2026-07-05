import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    inferFiscalYearFromTitle,
    isAnnualFundamentalTitle,
    parseFundamentalText,
} from './fundamentals.ts'

describe('isAnnualFundamentalTitle', () => {
    it('matches audited FY and 31.12 P&L', () => {
        assert.equal(isAnnualFundamentalTitle('3/27/2026 - KMB - Audited financial statements'), true)
        assert.equal(
            isAnnualFundamentalTitle('3/18/2026 - ADIN - Non-audited financial statements 01.01. - 31.12.'),
            true
        )
        assert.equal(
            isAnnualFundamentalTitle('5/14/2026 - ADIN - Non-audited profit&loss account 01.01. - 31.03.'),
            false
        )
    })
})

describe('inferFiscalYearFromTitle', () => {
    it('infers FY from audited filing date', () => {
        assert.equal(
            inferFiscalYearFromTitle('3/27/2026 - KMB - Audited financial statements', '2026-03-27'),
            2025
        )
    })

    it('infers FY from 31.12 period', () => {
        assert.equal(
            inferFiscalYearFromTitle(
                '3/18/2026 - ADIN - Non-audited financial statements 01.01. - 31.12.',
                '2026-03-18'
            ),
            2025
        )
    })
})

describe('parseFundamentalText', () => {
    it('parses EPS from sample text', () => {
        const parsed = parseFundamentalText(`
            Basic earnings per share 1,234.56 MKD
            Profit for the year attributable to equity holders 5,000,000
        `)
        assert.equal(parsed.eps, 1234.56)
        assert.equal(parsed.parseStatus, 'parsed')
    })
})
