/**
 * Cross-field validation for dividend calendar entries.
 * Nulls invalid fields in place; re-derives parseStatus when needed.
 */
import {
    deriveDividendParseStatus,
    matchesMseDps,
    resolveProfitYear,
    type DividendCalendarEntry,
} from './dividends'
import type { MseSymbolRatiosFile } from './mse-symbol-ratios'

export type DividendValidationIssueKind =
    | 'ex_not_after_cum'
    | 'record_before_ex'
    | 'payment_before_ex'
    | 'profit_year_after_ex'
    | 'mse_dps_mismatch'

export interface DividendValidationIssue {
    stockCode: string
    url: string
    filedAt: string
    kind: DividendValidationIssueKind
    detail: string
    clearedFields: string[]
}

export interface DividendValidationReport {
    generatedAt: string
    issueCount: number
    issues: DividendValidationIssue[]
}

function clearDateField(
    entry: DividendCalendarEntry,
    field: 'cumDate' | 'exDate' | 'recordDate' | 'paymentStart' | 'paymentEnd' | 'profitYear',
    cleared: string[]
): void {
    if (field === 'profitYear') entry.profitYear = null
    else entry[field] = null
    cleared.push(field)
}

/**
 * Validate and mutate entries. Returns issues for logging.
 * Does not drop rows — only nulls conflicting fields.
 */
export function validateDividendEntries(
    entries: DividendCalendarEntry[],
    options?: { mseRatios?: MseSymbolRatiosFile | null }
): DividendValidationReport {
    const issues: DividendValidationIssue[] = []
    const mse = options?.mseRatios ?? null

    for (const entry of entries) {
        const cleared: string[] = []
        const kinds: DividendValidationIssueKind[] = []
        const details: string[] = []

        if (entry.cumDate && entry.exDate && entry.exDate <= entry.cumDate) {
            kinds.push('ex_not_after_cum')
            details.push(`ex ${entry.exDate} not after cum ${entry.cumDate}`)
            // Prefer keeping ex when both equal/wrong; drop the implausible cum
            clearDateField(entry, 'cumDate', cleared)
        }

        if (entry.recordDate && entry.exDate && entry.recordDate < entry.exDate) {
            kinds.push('record_before_ex')
            details.push(`record ${entry.recordDate} before ex ${entry.exDate}`)
            clearDateField(entry, 'recordDate', cleared)
        }

        if (entry.paymentStart && entry.exDate && entry.paymentStart < entry.exDate) {
            kinds.push('payment_before_ex')
            details.push(`paymentStart ${entry.paymentStart} before ex ${entry.exDate}`)
            clearDateField(entry, 'paymentStart', cleared)
        }

        if (entry.paymentEnd && entry.exDate && entry.paymentEnd < entry.exDate) {
            kinds.push('payment_before_ex')
            details.push(`paymentEnd ${entry.paymentEnd} before ex ${entry.exDate}`)
            clearDateField(entry, 'paymentEnd', cleared)
        }

        if (entry.exDate && entry.profitYear != null) {
            const exYear = Number(entry.exDate.slice(0, 4))
            if (entry.profitYear > exYear) {
                kinds.push('profit_year_after_ex')
                details.push(`profitYear ${entry.profitYear} after ex year ${exYear}`)
                clearDateField(entry, 'profitYear', cleared)
            }
        }

        if (mse && entry.grossPerShare != null) {
            const year = resolveProfitYear(entry)
            if (year != null) {
                const mseDps =
                    mse.byCode[entry.stockCode.toUpperCase()]?.years[String(year)]?.dps ?? null
                if (
                    mseDps != null &&
                    mseDps > 0 &&
                    !matchesMseDps(entry.grossPerShare, mseDps) &&
                    entry.sourceFields?.grossPerShare !== 'MSE' &&
                    entry.source !== 'MSE' &&
                    entry.source !== 'manual'
                ) {
                    // Log only — do not null OCR/SECNet gross automatically (may be preferred share)
                    kinds.push('mse_dps_mismatch')
                    details.push(`gross ${entry.grossPerShare} vs MSE DPS ${mseDps} (FY ${year})`)
                }
            }
        }

        if (cleared.length > 0) {
            entry.parseStatus = deriveDividendParseStatus({
                grossPerShare: entry.grossPerShare,
                cumDate: entry.cumDate,
                exDate: entry.exDate,
                recordDate: entry.recordDate,
                paymentStart: entry.paymentStart,
                paymentEnd: entry.paymentEnd,
            })
        }

        if (kinds.length > 0) {
            // One issue row per kind for clarity
            for (let i = 0; i < kinds.length; i++) {
                issues.push({
                    stockCode: entry.stockCode,
                    url: entry.url,
                    filedAt: entry.filedAt,
                    kind: kinds[i]!,
                    detail: details[i] ?? details[0] ?? '',
                    clearedFields: cleared,
                })
            }
        }
    }

    return {
        generatedAt: new Date().toISOString(),
        issueCount: issues.length,
        issues,
    }
}
