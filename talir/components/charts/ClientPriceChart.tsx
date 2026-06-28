"use client"

import dynamic from 'next/dynamic'
import { ComponentProps } from 'react'

const PriceChart = dynamic(() => import('./PriceChart').then(mod => mod.PriceChart), {
    ssr: false,
    loading: () => <div className="h-[400px] w-full animate-pulse bg-surface-secondary/30 rounded-xl flex items-center justify-center text-text-tertiary">Loading Chart...</div>
})

export function ClientPriceChart(props: ComponentProps<typeof PriceChart>) {
    return <PriceChart {...props} />
}
