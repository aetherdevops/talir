/**
 * Stock split handling for MSE end-of-day history.
 *
 * MSE's symbolhistory feed is a raw print tape: it is never rebased for a split, so a
 * pre-split close sits next to a post-split close and every multi-day return crossing the
 * event is wrong by the split ratio. We keep the scraped JSON exactly as MSE serves it
 * (scripts/update.ts appends to it daily) and rebase on read instead, driven by the
 * registry in lib/data/corporate_actions.json.
 */
import corporateActionsFile from './data/corporate_actions.json'
import type { DailyPrice } from './types'

export type SplitKind = 'split' | 'reverse_split'

/**
 * `confirmed` means MSE or the issuer says so; `unconfirmed` is a heuristic hit awaiting a
 * human check. Only confirmed events are ever applied to prices.
 */
export type SplitConfidence = 'confirmed' | 'unconfirmed'

export interface StockSplit {
    code: string
    /** First session that traded on the new share basis (YYYY-MM-DD). */
    effectiveDate: string
    /** New shares per old share: 10 = a 1:10 forward split, 0.2 = a 5:1 reverse split. */
    ratio: number
    kind: SplitKind
    confidence: SplitConfidence
    note?: string
    source?: string
}

export interface CorporateActionsFile {
    version: number
    updatedAt: string
    splits: StockSplit[]
}

/**
 * Ratios a genuine MSE split can plausibly take. Anything else is an illiquid re-pricing,
 * not a corporate action — the registry stays a closed set on purpose.
 */
const SUPPORTED_RATIOS = [2, 2.5, 3, 4, 5, 6, 8, 10, 20, 25, 40, 50, 100]

/** MSE rebases its own reference price exactly, so this only absorbs rounding. */
const REBASE_TOLERANCE = 0.02

/**
 * A raw price gap is the split ratio times that session's real move, and MSE's daily band
 * is ±10%, so the observed gap can legitimately sit this far off the nominal ratio.
 */
const GAP_TOLERANCE = 0.12

/** A split is permanent; a price that climbs back toward the old basis was never split. */
const REVERSION_LOOKAHEAD_SESSIONS = 60

/**
 * A split takes effect between two sessions, allowing for the short halt MSE runs while the
 * CSD registers it. When a ticker last traded months ago, the gap carries no information —
 * it is just an illiquid name repricing.
 */
const MAX_GAP_DAYS = 10

export function loadCorporateActions(): CorporateActionsFile {
    return corporateActionsFile as CorporateActionsFile
}

/** Confirmed splits for one ticker, oldest first. */
export function getStockSplits(code: string): StockSplit[] {
    return loadCorporateActions()
        .splits.filter((s) => s.code === code && s.confidence === 'confirmed')
        .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate))
}

export function getAllStockSplits(): StockSplit[] {
    return loadCorporateActions()
        .splits.slice()
        .sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate) || a.code.localeCompare(b.code))
}

export function hasStockSplits(code: string): boolean {
    return getStockSplits(code).length > 0
}

/**
 * Cumulative number of today's shares that one share held on `isoDate` became.
 * Prices divide by it, share counts multiply by it. Post-split dates return 1.
 */
export function splitAdjustmentFactor(splits: StockSplit[], isoDate: string): number {
    let factor = 1
    for (const split of splits) {
        if (isoDate < split.effectiveDate) factor *= split.ratio
    }
    return factor
}

function divide(value: number | null | undefined, factor: number): number | null {
    if (value == null) return null
    if (!value) return value
    return value / factor
}

/**
 * Rebases history onto the current share basis. Prices and per-share values are divided by
 * the cumulative factor, traded quantity is multiplied by it, turnover is left alone
 * (a split moves no money). The percent change MSE printed on an effective date is
 * unusable — it compares bases — so it is recomputed from adjusted closes.
 *
 * Returns the input array untouched when the ticker has no splits.
 */
export function adjustHistoryForSplits(history: DailyPrice[], splits: StockSplit[]): DailyPrice[] {
    if (!history?.length || !splits.length) return history

    const effectiveDates = new Set(splits.map((s) => s.effectiveDate))

    const adjusted = history.map((row) => {
        const factor = splitAdjustmentFactor(splits, row.date)
        if (factor === 1) return row
        return {
            ...row,
            last_transaction_price: row.last_transaction_price / factor,
            max_price: divide(row.max_price, factor),
            min_price: divide(row.min_price, factor),
            average_price: row.average_price / factor,
            quantity: row.quantity * factor,
        }
    })

    for (let i = 1; i < adjusted.length; i++) {
        if (!effectiveDates.has(adjusted[i].date)) continue
        const prevClose = adjusted[i - 1].last_transaction_price
        const close = adjusted[i].last_transaction_price
        if (!prevClose || !close) continue
        adjusted[i] = {
            ...adjusted[i],
            percent_change: ((close - prevClose) / prevClose) * 100,
        }
    }

    return adjusted
}

/** Convenience wrapper for the common `adjust this ticker's history` call. */
export function adjustStockHistory(code: string, history: DailyPrice[]): DailyPrice[] {
    return adjustHistoryForSplits(history, getStockSplits(code))
}

// ---------------------------------------------------------------------------
// Detection
// ---------------------------------------------------------------------------

export interface SplitCandidate {
    code: string
    /** First session on the suspected new basis. */
    effectiveDate: string
    previousDate: string
    ratio: number
    kind: SplitKind
    confidence: SplitConfidence
    /** Observed gap before snapping to a supported ratio. */
    observedRatio: number
    previousClose: number
    close: number
    msePercentChange: number
    evidence: string[]
}

export interface DetectOptions {
    /** Events already in the registry, so a known split is not reported twice. */
    knownSplits?: StockSplit[]
    /**
     * Ignore events before this date. The daily job passes a recent window: the gap signal
     * is inherently noisy on twenty years of thinly traded history, and re-reporting 2006
     * every morning would train everyone to ignore it.
     */
    since?: string
}

/** Snaps an observed gap to a supported split ratio, or null if it matches none. */
function snapToSupportedRatio(observed: number, tolerance: number): number | null {
    if (!Number.isFinite(observed) || observed <= 0) return null

    const forward = observed >= 1
    const magnitude = forward ? observed : 1 / observed

    let best: number | null = null
    let bestError = Infinity
    for (const ratio of SUPPORTED_RATIOS) {
        const error = Math.abs(magnitude - ratio) / ratio
        if (error < bestError) {
            bestError = error
            best = ratio
        }
    }

    if (best == null || bestError > tolerance) return null
    return forward ? best : 1 / best
}

/** Carry-forward rows (no trade) repeat the last print and are not price events. */
function isTradedRow(row: DailyPrice): boolean {
    return row.quantity > 0 && row.average_price > 0
}

/**
 * True when the price climbs back toward the pre-event basis, which rules a split out.
 * The bar is the geometric mean of the old and new levels, so it scales with the ratio
 * instead of firing on every bounce after a 2:1.
 */
function revertsToOldBasis(
    tradedRows: DailyPrice[],
    startIndex: number,
    previousClose: number,
    ratio: number
): boolean {
    const threshold = ratio > 1 ? previousClose / Math.sqrt(ratio) : previousClose * Math.sqrt(1 / ratio)
    const end = Math.min(tradedRows.length, startIndex + REVERSION_LOOKAHEAD_SESSIONS)

    for (let i = startIndex; i < end; i++) {
        const close = tradedRows[i].last_transaction_price
        if (!close) continue
        if (ratio > 1 ? close >= threshold : close <= threshold) return true
    }
    return false
}

/**
 * Scans one ticker's raw history for splits MSE has not told us about.
 *
 * Two independent signals:
 *
 *  1. MSE silently rebased its own reference price — the percent change it printed implies
 *     a previous close a clean multiple away from the one in the tape. MSE only does this
 *     for a registered corporate action, so this is conclusive (it is REPL's fingerprint,
 *     and it is how a future split will surface).
 *  2. The raw close gapped by close to a supported ratio and never came back. This is the
 *     only thing that catches a split MSE never rebased (KMB 2005), but illiquid names on
 *     MSE routinely move ±100% on a handful of shares, so it stays unconfirmed until
 *     someone checks the issuer's filing.
 */
export function detectSplitCandidates(
    code: string,
    history: DailyPrice[],
    options: DetectOptions = {}
): SplitCandidate[] {
    const known = new Set(
        (options.knownSplits ?? [])
            .filter((s) => s.code === code)
            .map((s) => s.effectiveDate)
    )
    const since = options.since ?? ''

    const traded = (history ?? [])
        .filter(isTradedRow)
        .slice()
        .sort((a, b) => a.date.localeCompare(b.date))

    const candidates: SplitCandidate[] = []

    for (let i = 1; i < traded.length; i++) {
        const prev = traded[i - 1]
        const cur = traded[i]
        if (known.has(cur.date)) continue
        if (since && cur.date < since) continue

        const evidence: string[] = []

        // Signal 1 — MSE's printed percent change implies a rebased reference price.
        // A printed 0 is MSE's placeholder for "no reference price", not a real flat
        // session, so it can never be used to infer what MSE rebased to.
        const printedChange = cur.percent_change ?? 0
        const mseFactor = 1 + printedChange / 100
        let ratio: number | null = null
        let confidence: SplitConfidence = 'unconfirmed'
        let observed = prev.average_price / cur.average_price

        if (printedChange !== 0 && mseFactor > 0) {
            const impliedReference = cur.average_price / mseFactor
            const rebase = prev.average_price / impliedReference
            const snapped = snapToSupportedRatio(rebase, REBASE_TOLERANCE)
            if (snapped != null) {
                ratio = snapped
                observed = rebase
                confidence = 'confirmed'
                evidence.push(
                    `MSE rebased its reference price from ${prev.average_price} to ${impliedReference.toFixed(2)} ` +
                        `while printing ${printedChange}% — a ${formatRatio(snapped)} adjustment`
                )
            }
        }

        // Signal 2 — an unexplained gap in the raw tape.
        if (ratio == null) {
            if (daysBetween(prev.date, cur.date) > MAX_GAP_DAYS) continue

            const snapped = snapToSupportedRatio(observed, GAP_TOLERANCE)
            if (snapped == null) continue

            if (revertsToOldBasis(traded, i, prev.last_transaction_price, snapped)) continue

            ratio = snapped
            evidence.push(
                `Close gapped ${prev.last_transaction_price} → ${cur.last_transaction_price} ` +
                    `(${observed.toFixed(3)}×, nearest supported ratio ${formatRatio(snapped)}) and never recovered`
            )

            // A split changes the share count by the same factor, so traded quantity should
            // move with the ratio. Corroboration only — volume is erratic on this market.
            const priorVolume = averageQuantity(traded, Math.max(0, i - 10), i)
            const laterVolume = averageQuantity(traded, i, Math.min(traded.length, i + 10))
            const volumeMultiple = priorVolume > 0 ? laterVolume / priorVolume : 0
            if (volumeMultiple >= snapped / 2 && volumeMultiple <= snapped * 2) {
                evidence.push(
                    `Traded quantity moved ${volumeMultiple.toFixed(1)}× afterwards, in line with a ` +
                        `${formatRatio(snapped)} change in shares outstanding`
                )
            }
        }

        candidates.push({
            code,
            effectiveDate: cur.date,
            previousDate: prev.date,
            ratio,
            kind: ratio > 1 ? 'split' : 'reverse_split',
            confidence,
            observedRatio: observed,
            previousClose: prev.last_transaction_price,
            close: cur.last_transaction_price,
            msePercentChange: cur.percent_change ?? 0,
            evidence,
        })
    }

    return candidates
}

function daysBetween(fromIso: string, toIso: string): number {
    const from = Date.parse(fromIso)
    const to = Date.parse(toIso)
    if (Number.isNaN(from) || Number.isNaN(to)) return Infinity
    return Math.round((to - from) / 86_400_000)
}

function averageQuantity(rows: DailyPrice[], start: number, end: number): number {
    if (end <= start) return 0
    let sum = 0
    for (let i = start; i < end; i++) sum += rows[i].quantity
    return sum / (end - start)
}

/** `1:10` for a forward split, `5:1` for a reverse split. */
export function formatRatio(ratio: number): string {
    if (ratio >= 1) return `1:${trimNumber(ratio)}`
    return `${trimNumber(1 / ratio)}:1`
}

function trimNumber(value: number): string {
    return Number.isInteger(value) ? String(value) : String(Number(value.toFixed(4)))
}

/** Turns a confirmed detection into a registry entry. */
export function candidateToSplit(candidate: SplitCandidate, source?: string): StockSplit {
    return {
        code: candidate.code,
        effectiveDate: candidate.effectiveDate,
        ratio: candidate.ratio,
        kind: candidate.kind,
        confidence: candidate.confidence,
        note: candidate.evidence.join('. '),
        ...(source ? { source } : {}),
    }
}
