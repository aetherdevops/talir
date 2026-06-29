import type { Alert } from '@/lib/stores/alerts'

export function isAlertExpired(alert: Alert): boolean {
    if (alert.expiration.isOpenEnded) return false
    const dateStr = alert.expiration.date
    if (!dateStr) return false

    const timeStr = alert.expiration.time || '23:59'
    const expiresAt = new Date(`${dateStr}T${timeStr}`)
    return Number.isNaN(expiresAt.getTime()) ? false : Date.now() > expiresAt.getTime()
}

export function isAlertTriggered(alert: Alert, price: number): boolean {
    if (!alert.isActive || alert.triggeredAt) return false
    if (isAlertExpired(alert)) return false
    if (!alert.conditions.length) return false

    return alert.conditions.every((condition) =>
        condition.type === 'above' ? price >= condition.value : price <= condition.value
    )
}

export function getPriceMapFromSummary(
    summary: Array<{ code: string; price: number }>
): Map<string, number> {
    return new Map(summary.map((row) => [row.code, row.price]))
}
