'use client'

import { usePreferencesStore, type ChartRange, type ListDensity, type PortfolioCurrency } from '@/lib/stores/preferences'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

function OptionGrid<T extends string>({
    options,
    value,
    onChange,
}: {
    options: { value: T; label: string }[]
    value: T
    onChange: (v: T) => void
}) {
    return (
        <div className="flex flex-wrap gap-2">
            {options.map((opt) => (
                <button
                    key={opt.value}
                    type="button"
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        'px-3 py-2 rounded-lg text-sm border transition-colors min-h-[44px]',
                        value === opt.value
                            ? 'border-accent bg-accent-muted text-accent'
                            : 'border-border text-text-secondary hover:bg-surface-secondary'
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

export function DisplaySettings() {
    const { defaultChartRange, listDensity, setPreferences } = usePreferencesStore()
    const { t } = useLocale()

    const chartOptions: { value: ChartRange; label: string }[] = [
        { value: '1M', label: '1M' },
        { value: '3M', label: '3M' },
        { value: '6M', label: '6M' },
        { value: 'YTD', label: 'YTD' },
        { value: '1Y', label: '1Y' },
        { value: '5Y', label: '5Y' },
        { value: 'MAX', label: 'MAX' },
    ]

    const densityOptions: { value: ListDensity; label: string }[] = [
        { value: 'comfortable', label: t('settings.comfortable') },
        { value: 'compact', label: t('settings.compact') },
    ]

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-medium text-text-primary mb-2">{t('settings.chartRange')}</p>
                <OptionGrid
                    options={chartOptions}
                    value={defaultChartRange}
                    onChange={(defaultChartRange) => setPreferences({ defaultChartRange })}
                />
            </div>
            <div>
                <p className="text-sm font-medium text-text-primary mb-2">{t('settings.listDensity')}</p>
                <OptionGrid
                    options={densityOptions}
                    value={listDensity}
                    onChange={(listDensity) => setPreferences({ listDensity })}
                />
            </div>
        </div>
    )
}

export function DefaultSettings() {
    const { defaultPortfolioCurrency, setPreferences } = usePreferencesStore()
    const { t } = useLocale()

    const currencyOptions: { value: PortfolioCurrency; label: string }[] = [
        { value: 'MKD', label: 'MKD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'USD', label: 'USD' },
    ]

    return (
        <div>
            <p className="text-sm font-medium text-text-primary mb-2">{t('settings.defaultCurrency')}</p>
            <OptionGrid
                options={currencyOptions}
                value={defaultPortfolioCurrency}
                onChange={(defaultPortfolioCurrency) => setPreferences({ defaultPortfolioCurrency })}
            />
        </div>
    )
}
