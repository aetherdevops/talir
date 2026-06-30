"use client"

import { useEffect, useState } from 'react'
import { formatAsOfDate } from '@/lib/utils'

interface MarketStatusProps {
    asOfDate?: string
}

export function MarketStatus({ asOfDate }: MarketStatusProps) {
    const [status, setStatus] = useState<{ isOpen: boolean; message: string }>({
        isOpen: false,
        message: '…',
    })

    useEffect(() => {
        const checkStatus = () => {
            const now = new Date()
            const skopjeTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Skopje' }))
            const day = skopjeTime.getDay()
            const hour = skopjeTime.getHours()
            const minute = skopjeTime.getMinutes()
            const timeVal = hour * 60 + minute

            const openTime = 9 * 60
            const closeTime = 14 * 60 + 30

            const isWeekday = day >= 1 && day <= 5
            const isOpen = isWeekday && timeVal >= openTime && timeVal < closeTime

            let message = ''
            if (isOpen) {
                const minsLeft = closeTime - timeVal
                const hoursLeft = Math.floor(minsLeft / 60)
                message = `Session closes ${hoursLeft}h ${minsLeft % 60}m`
            } else if (isWeekday && timeVal < openTime) {
                message = 'Session opens 09:00'
            } else if (day === 5 && timeVal >= closeTime) {
                message = 'Next session Mon 09:00'
            } else if (day === 6 || day === 0) {
                message = 'Next session Mon 09:00'
            } else {
                message = 'Next session tomorrow 09:00'
            }

            setStatus({ isOpen, message })
        }

        checkStatus()
        const timer = setInterval(checkStatus, 60000)
        return () => clearInterval(timer)
    }, [])

    const asOfLabel = asOfDate ? formatAsOfDate(asOfDate) : null

    return (
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
            <div className="flex items-center gap-2 bg-surface-secondary/50 px-3 py-1.5 rounded-full border border-border w-fit">
                <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                        status.isOpen ? 'bg-success' : 'bg-text-tertiary'
                    }`}
                    aria-hidden
                />
                <span className="text-xs font-semibold text-text-secondary">
                    {status.isOpen ? 'Session open' : 'Session closed'}
                </span>
                <span className="text-xs text-text-tertiary border-l border-border pl-2 ml-0.5">
                    {status.message}
                </span>
            </div>
            {asOfLabel && (
                <span className="text-[11px] text-text-tertiary">
                    Prices from last close · {asOfLabel}
                </span>
            )}
        </div>
    )
}
