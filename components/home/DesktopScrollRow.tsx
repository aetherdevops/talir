'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

interface DesktopScrollRowProps {
    children: ReactNode
    className?: string
    scrollAmount?: number
}

/**
 * Horizontal quote row for lg+ only. Parent must hide this below lg
 * so overflow-x-auto never activates on mobile/tablet.
 */
export function DesktopScrollRow({
    children,
    className,
    scrollAmount = 200,
}: DesktopScrollRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)

    const updateScrollState = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        const fits = el.scrollWidth <= el.clientWidth + 1
        if (fits) {
            setCanScrollLeft(false)
            setCanScrollRight(false)
            return
        }
        setCanScrollLeft(el.scrollLeft > 1)
        setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 1)
    }, [])

    useEffect(() => {
        const el = scrollRef.current
        if (!el) return
        updateScrollState()
        el.addEventListener('scroll', updateScrollState, { passive: true })
        const ro = new ResizeObserver(updateScrollState)
        ro.observe(el)
        return () => {
            el.removeEventListener('scroll', updateScrollState)
            ro.disconnect()
        }
    }, [updateScrollState, children])

    const scroll = (direction: 'left' | 'right') => {
        scrollRef.current?.scrollBy({
            left: direction === 'left' ? -scrollAmount : scrollAmount,
            behavior: 'smooth',
        })
    }

    return (
        <div className={cn('flex items-center gap-1 min-w-0', className)}>
            {canScrollLeft ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-lg text-text-tertiary hover:text-text-primary"
                    onClick={() => scroll('left')}
                    aria-label="Scroll quotes left"
                >
                    <ChevronLeft className="h-4 w-4" aria-hidden />
                </Button>
            ) : (
                <span className="w-8 shrink-0" aria-hidden />
            )}

            <div
                ref={scrollRef}
                className="flex flex-1 gap-2 min-w-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory"
            >
                {children}
            </div>

            {canScrollRight ? (
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 rounded-lg text-text-tertiary hover:text-text-primary"
                    onClick={() => scroll('right')}
                    aria-label="Scroll quotes right"
                >
                    <ChevronRight className="h-4 w-4" aria-hidden />
                </Button>
            ) : (
                <span className="w-8 shrink-0" aria-hidden />
            )}
        </div>
    )
}
