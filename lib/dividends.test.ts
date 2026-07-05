import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
    applyOcrParseCap,
    computePayoutRatioPct,
    computeTrailingYieldAtEx,
    computeYoyGrowthPct,
    countCalendarsInLastYears,
    deriveDividendParseStatus,
    earliestCalendarYear,
    enrichDividendDerivedMetrics,
    findCloseOnOrBefore,
    formatDividendRowDetail,
    isDividendCalendarTitle,
    latestDisclosedDividend,
    latestParsedDividend,
    parseAmountMk,
    parseDividendCalendarText,
} from './dividends.ts'

describe('isDividendCalendarTitle', () => {
    it('matches dividend calendar titles', () => {
        assert.equal(isDividendCalendarTitle('5/28/2026 - NLB - Dividend Calendar'), true)
        assert.equal(isDividendCalendarTitle('Distribution of profit'), false)
    })
})

describe('parseAmountMk', () => {
    it('parses MKD formats', () => {
        assert.equal(parseAmountMk('2,571 MKD'), 2571)
        assert.equal(parseAmountMk('1,350.00'), 1350)
        assert.equal(parseAmountMk('150 денари по акција'), 150)
    })
})

describe('parseDividendCalendarText', () => {
    it('parses gross, cum, ex, and payment period from sample text', () => {
        const parsed = parseDividendCalendarText(`
            Gross dividend per share: 150 denars
            Last trading day cum-dividend: 10.06.2026
            First trading day ex-dividend: 11.06.2026
            Payment period: 15.06.2026 - 30.06.2026
        `)

        assert.equal(parsed.grossPerShare, 150)
        assert.equal(parsed.cumDate, '2026-06-10')
        assert.equal(parsed.exDate, '2026-06-11')
        assert.equal(parsed.paymentStart, '2026-06-15')
        assert.equal(parsed.paymentEnd, '2026-06-30')
        assert.equal(parsed.parseStatus, 'parsed')
    })

    it('parses NLB Bank calendar text', () => {
        const parsed = parseDividendCalendarText(`
            The amount of gross dividend per share is 2,571 MKD.
            Last date of trading with right for dividends is 09.06.2026. First date of trading without right
            for dividends is 10.06.2026. The date by which the list of the shareholders with right for
            dividends is determined is 11.06.2026
            Dividend payout will start at 29.06.2026.
        `)

        assert.equal(parsed.grossPerShare, 2571)
        assert.equal(parsed.cumDate, '2026-06-09')
        assert.equal(parsed.exDate, '2026-06-10')
        assert.equal(parsed.recordDate, '2026-06-11')
        assert.equal(parsed.paymentStart, '2026-06-29')
        assert.equal(parsed.parseStatus, 'parsed')
    })

    it('parses KMB calendar text', () => {
        const parsed = parseDividendCalendarText(`
            gross amount of MKD 1,350.00 per 1 ordinary share
            recording date for determining the list of shareholders who are entitled
            to dividend for 2025, shall be 14.04.2026.
            The last date for trading with dividend right for the year 2025 shall be 08.04.2026.
            The first date for trading without dividend right for the year 2025 shall be 09.04.2026.
            The commencement date for dividend payout for the year 2025 shall be 04.05.2026.
        `)

        assert.equal(parsed.grossPerShare, 1350)
        assert.equal(parsed.cumDate, '2026-04-08')
        assert.equal(parsed.exDate, '2026-04-09')
        assert.equal(parsed.recordDate, '2026-04-14')
        assert.equal(parsed.paymentStart, '2026-05-04')
        assert.equal(parsed.profitYear, 2025)
        assert.equal(parsed.parseStatus, 'parsed')
    })

    it('parses ALK Cyrillic OCR-style calendar text', () => {
        const alkOcrSnippet = `
            дивиденда за 2018 година во висина од 272,00 денари нето, односно 320,00 денари бруто, за една акција.
            Последен датум на тргување со право на дивиденда за 2018 година е 23.04.2019 година.
            Прв датум на тргување без право на дивиденда за 2018 година е 24.04.2019 година.
            Датум на стекнување на право на дивиденда за 2018 година е 25.04.2019 година.
            Исплата на дивидендата за 2018 година ќе започне од 22.05.2019 година.
        `
        const parsed = parseDividendCalendarText(alkOcrSnippet, { fromOcr: true })

        assert.equal(parsed.grossPerShare, 320)
        assert.equal(parsed.exDate, '2019-04-24')
        assert.equal(parsed.cumDate, '2019-04-23')
        assert.equal(parsed.recordDate, '2019-04-25')
        assert.equal(parsed.paymentStart, '2019-05-22')
        assert.equal(parsed.profitYear, 2018)
        assert.equal(parsed.parseStatus, 'partial')
    })

    it('rejects total dividend amount mistaken for per-share', () => {
        const parsed = parseDividendCalendarText(
            'Да се исплати дивидендата во бруто износ од 95.328.240 денари. Висината на бруто-дивиденда по акција ќе изнесува 105,00 денари.'
        )
        assert.equal(parsed.grossPerShare, 105)
    })

    it('returns partial when only amount is found', () => {
        const parsed = parseDividendCalendarText('Gross dividend per share is 500 MKD')
        assert.equal(parsed.grossPerShare, 500)
        assert.equal(parsed.parseStatus, 'partial')
    })

    it('returns link_only when no fields parsed', () => {
        const parsed = parseDividendCalendarText('Dividend Calendar published on SECNet')
        assert.equal(parsed.parseStatus, 'link_only')
        assert.equal(parsed.grossPerShare, null)
    })

    it('caps OCR-sourced full parse at partial', () => {
        const parsed = parseDividendCalendarText(
            `
            The amount of gross dividend per share is 2,571 MKD.
            Last date of trading with right for dividends is 09.06.2026. First date of trading without right
            for dividends is 10.06.2026. The date by which the list of the shareholders with right for
            dividends is determined is 11.06.2026
            Dividend payout will start at 29.06.2026.
        `,
            { fromOcr: true }
        )

        assert.equal(parsed.grossPerShare, 2571)
        assert.equal(parsed.parseStatus, 'partial')
    })

    it('downgrades OCR partial without ex-date to link_only', () => {
        const parsed = parseDividendCalendarText('gross dividend per share is 150 denars', { fromOcr: true })
        assert.equal(parsed.grossPerShare, 150)
        assert.equal(parsed.parseStatus, 'link_only')
    })
})

describe('applyOcrParseCap', () => {
    it('requires gross and ex-date for OCR partial', () => {
        assert.equal(
            applyOcrParseCap(
                {
                    grossPerShare: 100,
                    cumDate: null,
                    exDate: '2026-06-10',
                    recordDate: null,
                    paymentStart: null,
                    paymentEnd: null,
                },
                true
            ),
            'partial'
        )
        assert.equal(
            applyOcrParseCap(
                {
                    grossPerShare: 100,
                    cumDate: null,
                    exDate: null,
                    recordDate: null,
                    paymentStart: null,
                    paymentEnd: null,
                },
                true
            ),
            'link_only'
        )
    })
})

describe('countCalendarsInLastYears', () => {
    it('counts filings within rolling window', () => {
        const entries = [
            { filedAt: '2026-01-01', exDate: '2026-06-01' },
            { filedAt: '2019-01-01', exDate: '2019-06-01' },
        ] as Parameters<typeof countCalendarsInLastYears>[0]
        assert.equal(countCalendarsInLastYears(entries, 5, new Date('2026-07-03')), 1)
    })
})

describe('deriveDividendParseStatus', () => {
    it('never promotes partial to parsed', () => {
        assert.equal(
            deriveDividendParseStatus({
                grossPerShare: 100,
                cumDate: null,
                exDate: null,
                recordDate: null,
                paymentStart: null,
                paymentEnd: null,
            }),
            'partial'
        )
    })
})

describe('earliestCalendarYear', () => {
    it('returns earliest filing year across all entries', () => {
        const year = earliestCalendarYear([
            {
                stockCode: 'KMB',
                stockName: 'KMB',
                filedAt: '2026-03-27',
                url: 'https://seinet.com.mk/en/document/1',
                grossPerShare: null,
                cumDate: null,
                exDate: '2026-04-09',
                recordDate: null,
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'link_only',
                source: 'SECNet',
            },
            {
                stockCode: 'KMB',
                stockName: 'KMB',
                filedAt: '2023-03-29',
                url: 'https://seinet.com.mk/en/document/2',
                grossPerShare: 1200,
                cumDate: null,
                exDate: '2023-04-05',
                recordDate: null,
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'parsed',
                source: 'SECNet',
            },
        ])
        assert.equal(year, 2023)
    })
})

describe('formatDividendRowDetail', () => {
    it('formats parsed row with amount and ex date', () => {
        const line = formatDividendRowDetail({
            stockCode: 'NLB',
            stockName: 'NLB Banka',
            filedAt: '2026-05-28',
            url: 'https://seinet.com.mk/en/document/1',
            grossPerShare: 150,
            cumDate: '2026-06-10',
            exDate: '2026-06-11',
            recordDate: null,
            paymentStart: null,
            paymentEnd: null,
            parseStatus: 'parsed',
            source: 'SECNet',
            trailingYieldAtEx: null,
            yoyGrowthPct: null,
            profitYear: null,
            payoutRatioPct: null,
        })
        assert.match(line, /150/)
        assert.match(line, /ex 11\.06\.2026/)
    })
})

describe('findCloseOnOrBefore', () => {
    const history = [
        { date: '2026-04-07', last_transaction_price: 10000 },
        { date: '2026-04-08', last_transaction_price: 10100 },
        { date: '2026-04-09', last_transaction_price: 10200 },
    ]

    it('returns close on exact date', () => {
        assert.equal(findCloseOnOrBefore(history, '2026-04-09'), 10200)
    })

    it('returns last close before date when ex-date has no row', () => {
        assert.equal(findCloseOnOrBefore(history, '2026-04-10'), 10200)
    })
})

describe('computeTrailingYieldAtEx', () => {
    it('computes yield as percentage', () => {
        assert.equal(computeTrailingYieldAtEx(1350, '2026-04-09', 27000), 5)
    })

    it('returns null when inputs missing', () => {
        assert.equal(computeTrailingYieldAtEx(null, '2026-04-09', 1000), null)
    })
})

describe('computePayoutRatioPct', () => {
    it('computes DPS over EPS as percentage', () => {
        assert.equal(computePayoutRatioPct(1350, 2700), 50)
    })
})

describe('computeYoyGrowthPct', () => {
    it('computes growth between two gross amounts', () => {
        assert.equal(computeYoyGrowthPct(1350, 1200), 12.5)
    })
})

describe('enrichDividendDerivedMetrics', () => {
    it('fills yield and yoy on parsed entries', () => {
        const entries = [
            {
                stockCode: 'KMB',
                stockName: 'KMB',
                filedAt: '2025-03-27',
                url: 'https://seinet.com.mk/en/document/1',
                grossPerShare: 1200,
                cumDate: '2025-04-07',
                exDate: '2025-04-08',
                recordDate: '2025-04-14',
                paymentStart: '2025-05-01',
                paymentEnd: null,
                parseStatus: 'parsed' as const,
                source: 'SECNet' as const,
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear: 2025,
                payoutRatioPct: null,
            },
            {
                stockCode: 'KMB',
                stockName: 'KMB',
                filedAt: '2026-03-27',
                url: 'https://seinet.com.mk/en/document/2',
                grossPerShare: 1350,
                cumDate: '2026-04-08',
                exDate: '2026-04-09',
                recordDate: '2026-04-14',
                paymentStart: '2026-05-04',
                paymentEnd: null,
                parseStatus: 'parsed' as const,
                source: 'SECNet' as const,
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear: 2025,
                payoutRatioPct: null,
            },
        ]

        enrichDividendDerivedMetrics(entries, () => [
            { date: '2026-04-08', last_transaction_price: 27000 },
            { date: '2026-04-09', last_transaction_price: 27000 },
        ])

        assert.equal(entries[1].trailingYieldAtEx, 5)
        assert.equal(entries[1].yoyGrowthPct, 12.5)
        assert.equal(entries[0].yoyGrowthPct, null)
    })
})

describe('latestDisclosedDividend', () => {
    const base = {
        stockCode: 'GRNT',
        stockName: 'Granit AD Skopje',
        filedAt: '2026-05-18',
        url: 'https://seinet.com.mk/en/document/77219',
        cumDate: '2026-05-27',
        exDate: '2026-05-28',
        recordDate: null,
        paymentStart: null,
        paymentEnd: null,
        trailingYieldAtEx: null,
        yoyGrowthPct: null,
        profitYear: 2025,
        payoutRatioPct: null,
        source: 'SECNet' as const,
    }

    it('prefers newer partial over older parsed', () => {
        const picked = latestDisclosedDividend([
            { ...base, grossPerShare: 49, parseStatus: 'partial' },
            {
                ...base,
                filedAt: '2025-05-01',
                exDate: '2025-05-02',
                grossPerShare: 40,
                parseStatus: 'parsed',
            },
        ])
        assert.equal(picked?.grossPerShare, 49)
        assert.equal(picked?.parseStatus, 'partial')
    })

    it('ignores link_only entries', () => {
        const picked = latestDisclosedDividend([
            { ...base, grossPerShare: null, parseStatus: 'link_only' },
        ])
        assert.equal(picked, null)
    })
})

describe('latestParsedDividend', () => {
    it('excludes partial entries', () => {
        const picked = latestParsedDividend([
            {
                stockCode: 'GRNT',
                stockName: 'Granit',
                filedAt: '2026-05-18',
                url: 'https://example.com',
                grossPerShare: 49,
                cumDate: null,
                exDate: '2026-05-28',
                recordDate: null,
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'partial',
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear: null,
                payoutRatioPct: null,
                source: 'SECNet',
            },
        ])
        assert.equal(picked, null)
    })
})
