/**
 * MSE session status — informational only; never implies live prices.
 * Timezone: Europe/Skopje. Regular hours: Mon–Fri 09:00–14:30.
 */

export type MarketSessionState = 'open' | 'closed'

export interface MarketSession {
    state: MarketSessionState
    isOpen: boolean
    /** Screen-reader / compact label copy */
    label: string
}

const TIMEZONE = 'Europe/Skopje'
const OPEN_MINUTES = 9 * 60
const CLOSE_MINUTES = 14 * 60 + 30

/**
 * MSE non-trading days (weekends handled separately).
 *
 * ANNUAL MAINTENANCE — update each December:
 * 1. Open https://www.mse.mk/en/content/15/2/2018/calendar
 * 2. Copy the published non-trading dates for the new year
 * 3. Add a new year key below (YYYY-MM-DD strings, Skopje calendar dates)
 * 4. Cross-check with NBRM / economy.gov.mk holiday programme
 *
 * 2026 source: MSE trading calendar 2026 (mse.mk) + observed Monday substitutes (*).
 */
export const MSE_HOLIDAYS: Record<number, readonly string[]> = {
    2026: [
        '2026-01-01', // New Year's Day
        '2026-01-06', // Orthodox Christmas Eve (MSE)
        '2026-01-07', // Orthodox Christmas
        '2026-01-19', // Vodici / Epiphany (MSE)
        '2026-03-20', // Eid al-Fitr (MSE)
        '2026-04-10', // Orthodox Good Friday (MSE)
        '2026-04-13', // Orthodox Easter Monday (MSE)
        '2026-05-01', // Labour Day
        '2026-05-25', // Saints Cyril and Methodius (observed — May 24 Sunday)
        '2026-05-29', // Dormition of the Virgin (MSE)
        '2026-08-03', // Ilinden / Republic Day (observed — Aug 2 Sunday)
        '2026-08-28', // Dormition of the Virgin (MSE)
        '2026-09-08', // Independence Day
        '2026-10-12', // Uprising Day (observed — Oct 11 Sunday)
        '2026-10-23', // Day of the Macedonian Revolutionary Struggle
        '2026-12-08', // St. Clement of Ohrid
        '2026-12-31', // New Year's Eve (MSE)
    ],
}

const OPEN_LABEL = 'Session open · closes 14:30'
const CLOSED_LABEL = 'Session closed · end-of-day data'

type SkopjeParts = {
    year: number
    month: number
    day: number
    weekday: number
    minutes: number
    dateKey: string
}

function getSkopjeParts(date: Date): SkopjeParts {
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: TIMEZONE,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    })

    const parts = formatter.formatToParts(date)
    const read = (type: Intl.DateTimeFormatPartTypes) =>
        parts.find((part) => part.type === type)?.value ?? ''

    const year = Number(read('year'))
    const month = Number(read('month'))
    const day = Number(read('day'))
    const hour = Number(read('hour'))
    const minute = Number(read('minute'))
    const weekdayToken = read('weekday')

    const weekdayMap: Record<string, number> = {
        Sun: 0,
        Mon: 1,
        Tue: 2,
        Wed: 3,
        Thu: 4,
        Fri: 5,
        Sat: 6,
    }

    return {
        year,
        month,
        day,
        weekday: weekdayMap[weekdayToken] ?? 0,
        minutes: hour * 60 + minute,
        dateKey: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    }
}

function isWeekend(weekday: number): boolean {
    return weekday === 0 || weekday === 6
}

function isMseHoliday(dateKey: string, year: number): boolean {
    const holidays = MSE_HOLIDAYS[year]
    return holidays?.includes(dateKey) ?? false
}

export function getMarketSession(now: Date = new Date()): MarketSession {
    const skopje = getSkopjeParts(now)

    if (
        isWeekend(skopje.weekday) ||
        isMseHoliday(skopje.dateKey, skopje.year)
    ) {
        return { state: 'closed', isOpen: false, label: CLOSED_LABEL }
    }

    if (skopje.minutes >= OPEN_MINUTES && skopje.minutes < CLOSE_MINUTES) {
        return { state: 'open', isOpen: true, label: OPEN_LABEL }
    }

    return { state: 'closed', isOpen: false, label: CLOSED_LABEL }
}

/** Calendar date in Europe/Skopje (YYYY-MM-DD). */
export function skopjeTodayIso(now: Date = new Date()): string {
    return getSkopjeParts(now).dateKey
}

export const MARKET_SESSION_REFRESH_MS = 60_000
