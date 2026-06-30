'use client'

import { usePreferencesStore, type ChartRange, type ListDensity, type PortfolioCurrency } from '@/lib/stores/preferences'
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
        { value: 'comfortable', label: 'Comfortable' },
        { value: 'compact', label: 'Compact' },
    ]

    return (
        <div className="space-y-6">
            <div>
                <p className="text-sm font-medium text-text-primary mb-2">Default chart range</p>
                <OptionGrid
                    options={chartOptions}
                    value={defaultChartRange}
                    onChange={(defaultChartRange) => setPreferences({ defaultChartRange })}
                />
            </div>
            <div>
                <p className="text-sm font-medium text-text-primary mb-2">List density</p>
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

    const currencyOptions: { value: PortfolioCurrency; label: string }[] = [
        { value: 'MKD', label: 'MKD' },
        { value: 'EUR', label: 'EUR' },
        { value: 'USD', label: 'USD' },
    ]

    return (
        <div>
            <p className="text-sm font-medium text-text-primary mb-2">Default currency for new portfolios</p>
            <OptionGrid
                options={currencyOptions}
                value={defaultPortfolioCurrency}
                onChange={(defaultPortfolioCurrency) => setPreferences({ defaultPortfolioCurrency })}
            />
        </div>
    )
}
