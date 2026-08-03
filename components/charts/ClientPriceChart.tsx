"use client"

import dynamic from 'next/dynamic'
import { ComponentProps, useEffect, useState } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

function ChartLoadingSkeleton({ className }: { className?: string }) {
    const { t } = useLocale()
    return (
        <div
            className={cn(
                'w-full animate-pulse bg-surface-secondary/30 rounded-xl flex items-center justify-center text-text-tertiary',
                className ?? 'aspect-[1.45/1] md:aspect-auto md:h-[400px]'
            )}
        >
            {t('chart.loading')}
        </div>
    )
}

const PriceChart = dynamic(() => import('./PriceChart').then((mod) => mod.PriceChart), {
    ssr: false,
})

export function ClientPriceChart(props: ComponentProps<typeof PriceChart>) {
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setReady(true)
    }, [])

    if (!ready) {
        return <ChartLoadingSkeleton className={props.chartClassName} />
    }

    return <PriceChart {...props} />
}
