'use client'

import { useEffect, useRef } from 'react'
import marketSummary from '@/lib/data/market_summary.json'
import { getPriceMapFromSummary } from '@/lib/alerts/evaluate'
import { useAlertsStore } from '@/lib/stores/alerts'

export function AlertEvaluator() {
    const evaluateAgainstPrices = useAlertsStore((s) => s.evaluateAgainstPrices)
    const lastTriggered = useRef<Set<string>>(new Set())

    useEffect(() => {
        const prices = getPriceMapFromSummary(
            marketSummary as Array<{ code: string; price: number }>
        )
        const newlyTriggered = evaluateAgainstPrices(prices)

        for (const symbol of newlyTriggered) {
            if (lastTriggered.current.has(symbol)) continue
            lastTriggered.current.add(symbol)
            window.dispatchEvent(
                new CustomEvent('talir-alert-triggered', { detail: { symbol } })
            )
        }
    }, [evaluateAgainstPrices])

    useEffect(() => {
        const interval = window.setInterval(() => {
            const prices = getPriceMapFromSummary(
                marketSummary as Array<{ code: string; price: number }>
            )
            const newlyTriggered = evaluateAgainstPrices(prices)

            for (const symbol of newlyTriggered) {
                if (lastTriggered.current.has(symbol)) continue
                lastTriggered.current.add(symbol)
                window.dispatchEvent(
                    new CustomEvent('talir-alert-triggered', { detail: { symbol } })
                )
            }
        }, 60_000)

        return () => window.clearInterval(interval)
    }, [evaluateAgainstPrices])

    return null
}
