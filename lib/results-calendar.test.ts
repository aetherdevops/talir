import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    buildResultsEntriesFromNews,
    classifyReportKind,
    inferPeriodYear,
    isResultsReport,
    newsItemToResultsEntry,
    parseReportPeriod,
} from './results-calendar.ts'
import type { NewsItem } from './types.ts'

function mockItem(overrides: Partial<NewsItem> & Pick<NewsItem, 'rawTitle' | 'publishedAt'>): NewsItem {
    return {
        id: 'test-1',
        title: 'TEST headline',
        source: 'SECNet',
        stockCode: 'KMB',
        stockName: 'Komercijalna Banka',
        category: 'earnings',
        publishedAt: overrides.publishedAt,
        dateKnown: true,
        url: 'https://seinet.com.mk/en/document/1',
        ...overrides,
    }
}

describe('parseReportPeriod', () => {
    it('parses DD.MM. - DD.MM. ranges', () => {
        const period = parseReportPeriod(
            '5/15/2026 - Makpetrol - Non-audited profit&loss account 01.01. - 31.03.'
        )
        assert.ok(period)
        assert.equal(period.label, '01.01–31.03')
        assert.equal(period.endMonth, 3)
    })

    it('returns null when no period in title', () => {
        assert.equal(parseReportPeriod('5/19/2026 - SIL - Audited financial statements'), null)
    })
})

describe('inferPeriodYear', () => {
    it('assigns Q1 to filing year when filed after March', () => {
        assert.equal(inferPeriodYear(3, 31, '2026-05-15'), 2026)
    })

    it('assigns FY to previous year when filed in H1', () => {
        assert.equal(inferPeriodYear(12, 31, '2026-02-25'), 2025)
    })
})

describe('isResultsReport', () => {
    it('includes P&L and financial statements', () => {
        assert.equal(isResultsReport('Non-audited profit&loss account 01.01. - 31.03.'), true)
        assert.equal(isResultsReport('Audited financial statements'), true)
        assert.equal(isResultsReport('Non-audited financial statements 01.01. - 30.06.'), true)
    })

    it('excludes dividends', () => {
        assert.equal(isResultsReport('Dividend Calendar'), false)
    })
})

describe('classifyReportKind', () => {
    it('maps period end months to report kinds', () => {
        assert.equal(classifyReportKind('profit&loss 01.01. - 31.03.', 3), 'q1_pl')
        assert.equal(classifyReportKind('financial statements 01.01. - 30.06.', 6), 'h1_fs')
        assert.equal(classifyReportKind('profit&loss 01.01. - 30.09.', 9), 'q3_pl')
    })

    it('maps audited titles to fy_audited', () => {
        assert.equal(classifyReportKind('Audited financial statements', null), 'fy_audited')
    })
})

describe('newsItemToResultsEntry dedupe', () => {
    it('dedupes same issuer period keeping latest filing', () => {
        const items: NewsItem[] = [
            mockItem({
                id: 'a',
                rawTitle: '4/28/2026 - KMB - Non-audited profit&loss account 01.01. - 31.03.',
                publishedAt: '2026-04-28',
            }),
            mockItem({
                id: 'b',
                rawTitle: '4/30/2026 - KMB - Non-audited profit&loss account 01.01. - 31.03.',
                publishedAt: '2026-04-30',
            }),
        ]

        const entries = buildResultsEntriesFromNews(items)
        assert.equal(entries.length, 1)
        assert.equal(entries[0].filedAt, '2026-04-30')
        assert.equal(entries[0].reportKind, 'q1_pl')
        assert.equal(entries[0].periodEnd, '2026-03-31')
    })

    it('returns null for non-result filings', () => {
        assert.equal(
            newsItemToResultsEntry(
                mockItem({
                    rawTitle: '5/20/2026 - KMB - Corporate governance questionnaire',
                    publishedAt: '2026-05-20',
                })
            ),
            null
        )
    })
})
