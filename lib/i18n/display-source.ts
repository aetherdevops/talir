import type { Locale } from '@/lib/i18n/config'

export function displayFilingSource(locale: Locale, source: string): string {
    if (locale === 'mk' && source === 'SECNet') return 'СЕИ-Нет'
    if (locale === 'mk' && source === 'MSE') return 'МБ'
    return source
}
