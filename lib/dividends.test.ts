import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'fs'
import path from 'path'
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
    hasAnalyticsCore,
    isDividendCalendarTitle,
    latestDisclosedDividend,
    latestParsedDividend,
    matchesMseDps,
    normalizeOcrDividendText,
    parseAmountMk,
    parseDividendCalendarText,
} from './dividends.ts'

describe('hasAnalyticsCore', () => {
    it('requires gross and ex-date only', () => {
        assert.equal(
            hasAnalyticsCore({
                stockCode: 'X',
                stockName: 'X',
                filedAt: '2026-01-01',
                url: 'https://example.com',
                grossPerShare: 10,
                cumDate: null,
                exDate: '2026-06-01',
                recordDate: null,
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'partial',
                source: 'SECNet',
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear: 2025,
                payoutRatioPct: null,
            }),
            true
        )
        assert.equal(
            hasAnalyticsCore({
                stockCode: 'X',
                stockName: 'X',
                filedAt: '2026-01-01',
                url: 'https://example.com',
                grossPerShare: 10,
                cumDate: null,
                exDate: null,
                recordDate: null,
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'partial',
                source: 'SECNet',
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear: 2025,
                payoutRatioPct: null,
            }),
            false
        )
    })
})

describe('normalizeOcrDividendText', () => {
    it('fixes common Latin lookalikes in MK OCR', () => {
        const out = normalizeOcrDividendText('бpуто дuвиденда 45 дeнари')
        assert.match(out, /бруто/)
        assert.match(out, /дивиденда/)
        assert.match(out, /денари/)
    })
})

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
        assert.equal(parseAmountMk('28.9250940552'), 28.9250940552)
        assert.equal(parseAmountMk('1.350,00'), 1350)
        assert.equal(parseAmountMk('1.234.567'), 1234567)
        assert.equal(parseAmountMk('4.620'), 4620)
        assert.equal(parseAmountMk('12.500'), 12.5)
        assert.equal(parseAmountMk('55,56'), 55.56)
        assert.equal(parseAmountMk('55,556'), 55.56) // OCR slip of European 55,56
        assert.equal(parseAmountMk('36,667'), 36.67) // OCR slip of European 36,67
        assert.equal(parseAmountMk('6,00'), 6)
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

        const promoted = parseDividendCalendarText(alkOcrSnippet, {
            fromOcr: true,
            mseDps: 320,
        })
        assert.equal(promoted.parseStatus, 'parsed')
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

    it('parses TEL English SA Resolution OCR (attachment 83381)', () => {
        // Real OCR text from Makedonski Telekom DOC_10688 scan (FY 2025 calendar).
        const telOcr = `
            Pursuant to the Law on Trade Companies, the Statute of Makedonski Telekom AD - Skopje
            (the Company), the Proposal of the Board of Directors on the payment of the dividend of the
            Company for the Year 2025 and determination of the dividend calendar
            Article 1 The Shareholders' Assembly of the Company hereby approves the dividend payment
            for the year 2025 in a total gross amount of MKD 2,494,931,182.00 (two billion four hundred
            and ninety-four million nine hundred and thirty-one thousand one hundred and eighty-two denars),
            which in accordance with the Resolution on the distribution of the net profit of the Company
            for the Year 2025 is the net profit generated. The gross amount of the dividend per share
            shall be MKD 28.9250940552 (twenty-eight denars and ninety-three deni, rounded up to two decimals).
            Article 2 The recording date in accordance with which the list of shareholders who are entitled
            to a dividend for the Year 2025 is determined, shall be 03.07.2026.
            Article 3 The last day of trading with the right to dividend for the Year 2025 shall be 01.07.2026.
            Article 4 The first day of trading without the right to dividend for the Year 2025 shall be 02.07.2026.
            Article 5 The payment of the dividend for the Year 2025 shall be effectuated up to 30.09.2026.
        `
        const parsed = parseDividendCalendarText(telOcr, { fromOcr: true })

        assert.ok(parsed.grossPerShare !== null)
        assert.ok(Math.abs(parsed.grossPerShare! - 28.9250940552) < 1e-6)
        assert.equal(parsed.cumDate, '2026-07-01')
        assert.equal(parsed.exDate, '2026-07-02')
        assert.equal(parsed.recordDate, '2026-07-03')
        assert.equal(parsed.paymentEnd, '2026-09-30')
        assert.equal(parsed.parseStatus, 'partial')
    })

    it('parses STB preferred-share бруто износ OCR without taking nominal 400', () => {
        const stbOcr = `
            ОДЛУКА за начинот на пресметување и исплата на дивидендата на приоритетните акции
            на Стопанска банка АД - Скопје за 2024 година
            1. Стопанска банка АД - Скопје (СБ) ќе изврши исплата на дивиденда на приоритетните акции
            за 2024 година во вкупен износ од денари 1.364.664,00 или бруто износ од денари 6,00 по акција.
            2. Основицата за пресметка на дивидендата изнесува денари 90.977.600,00
            (227.444 приоритетни акции по номинална вредност од денари 400,00 по акција).
            3. Датум на евиденција според кој се определува листата на акционери кои имаат право на дивиденда,
            односно датум на пресек на Акционерската книга, е 16.06.2025 година.
            4. Последен ден на тргување со право на дивиденда е 12.06.2025 година.
            5. Прв ден на тргување без право на дивиденда е 13.06.2025 година.
        `
        const parsed = parseDividendCalendarText(stbOcr, { fromOcr: true })
        assert.equal(parsed.grossPerShare, 6)
        assert.equal(parsed.cumDate, '2025-06-12')
        assert.equal(parsed.exDate, '2025-06-13')
        assert.equal(parsed.recordDate, '2025-06-16')
        assert.equal(parsed.parseStatus, 'partial')
    })

    it('parses MPT MK thousands DPS 4.620 as 4620', () => {
        const mptOcr = `
            ОДЛУКА за плаќање на дивиденда по Годишната сметка на Друштвото за 2025 година
            Член 1 На акционерите на Макпетрол АД Скопје се одобрува плаќање на дивиденда во висина од
            467.285.280 денари бруто, односно 4.620 денари бруто за една акција.
            Член 2 За датум на пресек на акционерската книга според која се определува листата на акционери
            кои имаат право на исплата на дивиденда се утврдува 16.6.2026 година.
            Член 3 За последен ден на тргување со право на дивиденда се утврдува 12.6.2026 година.
            Член 4 За прв ден на тргување без право на дивиденда се утврдува 15.6.2026 година.
            Член 5 Исплатата на дивиденда ќе се изврши до 30.9.2026 година.
        `
        const parsed = parseDividendCalendarText(mptOcr, { fromOcr: true })
        assert.equal(parsed.grossPerShare, 4620)
        assert.equal(parsed.cumDate, '2026-06-12')
        assert.equal(parsed.exDate, '2026-06-15')
        assert.equal(parsed.recordDate, '2026-06-16')
        assert.equal(parsed.paymentStart, null)
        assert.equal(parsed.paymentEnd, '2026-09-30')
        assert.equal(parsed.parseStatus, 'partial')
    })

    it('parses TTK total бруто-дивиденда not cash/share split leg', () => {
        const ttkOcr = `
            ОДЛУКА за определување на износот на дивиденда и датуми на исплата на дивиденда за 2025 година
            Член 1 Да се исплати дивидендата во бруто-износ од 89.886.051 денари.
            Член 2 Висината на бруто-дивиденда по акција ќе изнесува 87,00 денари, односно 8,7% од номиналната
            вредност на акциите којашто изнесува 1.000 денари и тоа 43 денари бруто - дивиденда во акции
            и 44 денари бруто -дивиденда во пари.
            Член 4 Последен ден на тргување со право на дивиденда за 2025 година е 27.3.2026 година.
            Член 5 Прв ден на тргување без право на дивиденда за 2025 година е 30.3.2026 година.
        `
        const parsed = parseDividendCalendarText(ttkOcr, { fromOcr: true })
        assert.equal(parsed.grossPerShare, 87)
        assert.equal(parsed.cumDate, '2026-03-27')
        assert.equal(parsed.exDate, '2026-03-30')
        assert.equal(parsed.parseStatus, 'partial')
    })

    it('parses ALK English Denars per share gross resolution', () => {
        const alkEn = `
            RESOLUTION on the dates for payment of the 2025 dividend (dividend calendar)
            Article 1 Pursuant to the Resolution on use and distribution of the net profit earned under
            the 2025 annual account, shareholders shall be paid 648,00 Denars per share net or
            720,00 Denars per share gross as dividend for 2025.
            Article 2 Last day of trading with the right to dividend for 2025 shall be 14.04.2026.
            Article 3 First day of trading without the right to dividend for 2025 shall be 15.04.2026.
            Article 4 The day of acquiring the right to dividend for 2025 shall be 16.04.2026.
            Article 5 Payment of the dividend for 2025 shall commence on 13.05.2026.
        `
        const parsed = parseDividendCalendarText(alkEn)
        assert.equal(parsed.grossPerShare, 720)
        assert.equal(parsed.cumDate, '2026-04-14')
        assert.equal(parsed.exDate, '2026-04-15')
        assert.equal(parsed.recordDate, '2026-04-16')
        assert.equal(parsed.paymentStart, '2026-05-13')
        assert.equal(parsed.parseStatus, 'parsed')
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

    it('downgrades OCR without gross or any core date to link_only', () => {
        const parsed = parseDividendCalendarText('gross dividend per share is 150 denars', { fromOcr: true })
        assert.equal(parsed.grossPerShare, 150)
        assert.equal(parsed.parseStatus, 'link_only')
    })

    it('keeps OCR partial when gross + cum date (no ex)', () => {
        const parsed = parseDividendCalendarText(
            'gross dividend per share is 130 denars. последен ден со право на дивиденда 06.07.2024',
            { fromOcr: true }
        )
        assert.equal(parsed.grossPerShare, 130)
        assert.equal(parsed.cumDate, '2024-07-06')
        assert.equal(parsed.parseStatus, 'partial')
    })

    it('parses noisy OCR TEHN-style Cyrillic text', () => {
        const noisy = `
            бpуто-дuвиденда по акција изнeсува 45,00 дeнари.
            Последен датум на тргувaње со пpаво на дивиденда 10.06.2025.
            Прв датум на тргување без право на дивиденда 11.06.2025.
            Исплата ќе започне од 01.07.2025.
            дивиденда за 2024 година
        `
        const parsed = parseDividendCalendarText(noisy, { fromOcr: true })
        assert.equal(parsed.grossPerShare, 45)
        assert.equal(parsed.exDate, '2025-06-11')
        assert.equal(parsed.cumDate, '2025-06-10')
        assert.equal(parsed.paymentStart, '2025-07-01')
        assert.equal(parsed.profitYear, 2024)
        assert.equal(parsed.parseStatus, 'partial')
    })
})

describe('applyOcrParseCap', () => {
    it('accepts OCR partial with gross and cum/record when ex missing', () => {
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
                    cumDate: '2026-06-09',
                    exDate: null,
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

    it('promotes OCR to parsed only when MSE DPS matches or adminConfirmed', () => {
        const full = {
            grossPerShare: 320,
            cumDate: '2019-04-23',
            exDate: '2019-04-24',
            recordDate: '2019-04-25',
            paymentStart: '2019-05-22',
            paymentEnd: null,
        }
        assert.equal(applyOcrParseCap(full, true), 'partial')
        assert.equal(applyOcrParseCap(full, true, { mseDps: 320 }), 'parsed')
        assert.equal(applyOcrParseCap(full, true, { mseDps: 400 }), 'partial')
        assert.equal(applyOcrParseCap(full, true, { adminConfirmed: true }), 'parsed')
    })
})

describe('matchesMseDps', () => {
    it('allows ±1% tolerance', () => {
        assert.equal(matchesMseDps(28.93, 28.925), true)
        assert.equal(matchesMseDps(28.93, 30), false)
        assert.equal(matchesMseDps(null, 28), false)
    })
})

describe('golden OCR fixtures', () => {
    const fixturesDir = path.join(process.cwd(), 'lib', '__fixtures__', 'dividends')
    const manifestPath = path.join(fixturesDir, 'manifest.json')

    it('reparses committed fixtures without throwing and keeps status bounds', () => {
        if (!fs.existsSync(manifestPath)) {
            // Fixtures optional in shallow checkouts
            return
        }
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8')) as Array<{
            file: string
            parseStatus: string
        }>
        assert.ok(manifest.length >= 5)
        for (const row of manifest) {
            const text = fs.readFileSync(path.join(fixturesDir, row.file), 'utf8')
            const parsed = parseDividendCalendarText(text, { fromOcr: true })
            assert.ok(
                parsed.parseStatus === 'parsed' ||
                    parsed.parseStatus === 'partial' ||
                    parsed.parseStatus === 'link_only'
            )
            // Without MSE cross-check, OCR must not silently become parsed
            if (!row.file.startsWith('full-partial')) {
                assert.notEqual(parsed.parseStatus, 'parsed')
            }
        }
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
    it('fills yield and yoy on analytics-core entries including partial', () => {
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
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'partial' as const,
                source: 'SECNet' as const,
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear: 2024,
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
                paymentStart: null,
                paymentEnd: null,
                parseStatus: 'partial' as const,
                source: 'SECNet' as const,
                trailingYieldAtEx: null,
                yoyGrowthPct: null,
                profitYear: 2025,
                payoutRatioPct: null,
            },
        ]

        enrichDividendDerivedMetrics(entries, () => [
            { date: '2025-04-08', last_transaction_price: 24000 },
            { date: '2026-04-08', last_transaction_price: 27000 },
            { date: '2026-04-09', last_transaction_price: 27000 },
        ])

        assert.equal(entries[1].trailingYieldAtEx, 5)
        assert.equal(entries[1].yoyGrowthPct, 12.5)
        assert.equal(entries[0].yoyGrowthPct, null)
        assert.ok(entries[0].trailingYieldAtEx !== null)
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
