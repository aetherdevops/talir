"use client"

import { useEffect, useState } from 'react'

export function MarketStatus() {
    const [status, setStatus] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: 'Loading...' })

    useEffect(() => {
        const checkStatus = () => {
            const now = new Date()

            // Convert to Europe/Skopje time (approximate by offset if needed, but simple check for now)
            // Assuming local system time or server time is close enough or handled via standard Date in client
            // But strict requirement says "Europe/Skopje". Code runs in browser, so it uses user's timezone.
            // Ideally we check UTC. Skopje is UTC+1 (CET) / UTC+2 (CEST).

            // For simplicity in this demo, we assume the user is in the relevant TZ or we just use local hours 9-14:30.
            // A more robust solution would Use Intl.DateTimeFormat with 'Europe/Skopje'

            const skopjeTime = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Skopje" }))
            const day = skopjeTime.getDay()
            const hour = skopjeTime.getHours()
            const minute = skopjeTime.getMinutes()
            const timeVal = hour * 60 + minute

            const openTime = 9 * 60 // 09:00
            const closeTime = 14 * 60 + 30 // 14:30

            const isWeekday = day >= 1 && day <= 5
            const isOpen = isWeekday && timeVal >= openTime && timeVal < closeTime

            let message = ''
            if (isOpen) {
                // Time until close
                const minsLeft = closeTime - timeVal
                const hoursLeft = Math.floor(minsLeft / 60)
                message = `Closes in ${hoursLeft}h ${minsLeft % 60}m`
            } else {
                // Determine next open
                if (isWeekday && timeVal < openTime) {
                    message = `Opens today at 09:00`
                } else if (day === 5 && timeVal >= closeTime) { // Friday after close
                    message = `Opens Mon 09:00`
                } else if (day === 6) { // Sat
                    message = `Opens Mon 09:00`
                } else if (day === 0) { // Sun
                    message = `Opens Mon 09:00`
                } else { // Weekday after close (Mon-Thu)
                    message = `Opens tomorrow 09:00`
                }
            }

            setStatus({ isOpen, message })
        }

        checkStatus()
        const timer = setInterval(checkStatus, 60000)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="flex items-center gap-2 bg-surface-secondary/50 px-3 py-1.5 rounded-full border border-border w-fit">
            <span className={`relative flex h-2.5 w-2.5`}>
                {status.isOpen && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.isOpen ? 'bg-success' : 'bg-text-tertiary'}`}></span>
            </span>
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                {status.isOpen ? 'Market Open' : 'Market Closed'}
            </span>
            <span className="text-xs text-text-tertiary border-l border-border pl-2 ml-1">
                {status.message}
            </span>
        </div>
    )
}
