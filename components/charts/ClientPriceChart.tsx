"use client"

import dynamic from 'next/dynamic'
import { ComponentProps } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'

function ChartLoadingSkeleton() {
    const { t } = useLocale()
    return (
        <div className="aspect-[1.45/1] md:aspect-auto md:h-[400px] w-full animate-pulse bg-surface-secondary/30 rounded-xl flex items-center justify-center text-text-tertiary">
            {t('chart.loading')}
        </div>
    )
}

const PriceChart = dynamic(() => import('./PriceChart').then((mod) => mod.PriceChart), {
    ssr: false,
    loading: () => <ChartLoadingSkeleton />,
})

export function ClientPriceChart(props: ComponentProps<typeof PriceChart>) {
    return <PriceChart {...props} />
}
