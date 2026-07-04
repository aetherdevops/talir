/**
 * MSE equity universe for breadth / sentiment (excludes indices and government bonds).
 * Keep in sync with scripts/generate-derived-market.mjs isExcludedCode().
 */
export function isExcludedEquityCode(code: string): boolean {
    if (code === 'MBI10' || code === 'OMB') return true
    if (/^M\d/.test(code) || code.startsWith('RMDEN')) return true
    return false
}

/** Listed equity with a quotable price or same-day trade (breadth / sentiment universe). */
export function isMseEquityInstrument(code: string, price: number, volume: number, turnover = 0): boolean {
    if (isExcludedEquityCode(code)) return false
    return price > 0 || volume > 0 || turnover > 0
}
