'use client'

import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InfoPopoverProps {
    label: string
    children: ReactNode
    className?: string
}

/** Small (i) affordance — hover tooltip on desktop, tap popover on mobile; dismiss on outside tap. */
export function InfoPopover({ label, children, className }: InfoPopoverProps) {
    const [open, setOpen] = useState(false)
    const [hover, setHover] = useState(false)
    const rootRef = useRef<HTMLDivElement>(null)
    const tooltipId = useId()
    const visible = open || hover

    useEffect(() => {
        if (!open) return
        const onPointerDown = (event: PointerEvent) => {
            if (rootRef.current?.contains(event.target as Node)) return
            setOpen(false)
        }
        document.addEventListener('pointerdown', onPointerDown)
        return () => document.removeEventListener('pointerdown', onPointerDown)
    }, [open])

    return (
        <div ref={rootRef} className={cn('relative inline-flex shrink-0', className)}>
            <button
                type="button"
                className="inline-flex items-center justify-center h-4 w-4 rounded-full text-text-tertiary hover:text-text-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                aria-label={`About ${label}`}
                aria-expanded={open}
                aria-describedby={visible ? tooltipId : undefined}
                onClick={() => setOpen((value) => !value)}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
            >
                <Info className="h-3 w-3" strokeWidth={2} aria-hidden />
            </button>
            {visible ? (
                <div
                    id={tooltipId}
                    role="tooltip"
                    className={cn(
                        'absolute z-50 left-1/2 -translate-x-1/2 top-full mt-1.5 w-56 max-w-[min(16rem,calc(100vw-2rem))]',
                        'rounded-lg bg-surface-elevated px-3 py-2 text-[11px] leading-snug text-text-secondary',
                        'shadow-[0_4px_16px_rgba(0,0,0,0.12)] dark:shadow-[0_4px_16px_rgba(0,0,0,0.35)]'
                    )}
                >
                    {children}
                </div>
            ) : null}
        </div>
    )
}
