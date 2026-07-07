'use client'

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/Button'

const DRAG_THRESHOLD_PX = 5

function isInteractiveTarget(target: EventTarget | null): boolean {
    return Boolean(
        target instanceof Element &&
            target.closest('a, button, input, textarea, select, [role="link"], [data-no-drag]')
    )
}

interface DesktopScrollRowProps {
    children: ReactNode
    className?: string
    scrollAmount?: number
}

/**
 * Horizontal quote row for lg+ with chevrons and pointer drag.
 * Parent must clip mobile/tablet with MobileLeaderboardScrollRow instead.
 */
export function DesktopScrollRow({
    children,
    className,
    scrollAmount = 200,
}: DesktopScrollRowProps) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const [canScrollLeft, setCanScrollLeft] = useState(false)
    const [canScrollRight, setCanScrollRight] = useState(false)
    const [isDragging, setIsDragging] = useState(false)

    const dragState = useRef({
        active: false,
        didDrag: false,
        startX: 0,
        scrollLeft: 0,
        lastX: 0,
        lastTime: 0,
        velocity: 0,
        momentumId: 0,
    })

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

    const stopMomentum = useCallback(() => {
        if (dragState.current.momentumId) {
            cancelAnimationFrame(dragState.current.momentumId)
            dragState.current.momentumId = 0
        }
    }, [])

    const startMomentum = useCallback(() => {
        const el = scrollRef.current
        if (!el) return
        let velocity = dragState.current.velocity
        if (Math.abs(velocity) < 0.15) return

        const step = () => {
            if (!scrollRef.current || Math.abs(velocity) < 0.05) {
                dragState.current.momentumId = 0
                return
            }
            scrollRef.current.scrollLeft -= velocity * 16
            velocity *= 0.92
            dragState.current.momentumId = requestAnimationFrame(step)
        }
        dragState.current.momentumId = requestAnimationFrame(step)
    }, [])

    const onPointerDown = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.pointerType === 'touch') return
            if (event.button !== 0) return
            if (isInteractiveTarget(event.target)) return

            stopMomentum()
            const el = scrollRef.current
            if (!el) return

            el.setPointerCapture(event.pointerId)
            dragState.current = {
                ...dragState.current,
                active: true,
                didDrag: false,
                startX: event.clientX,
                scrollLeft: el.scrollLeft,
                lastX: event.clientX,
                lastTime: performance.now(),
                velocity: 0,
            }
        },
        [stopMomentum]
    )

    const onPointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
        if (event.pointerType === 'touch') return
        if (!dragState.current.active) return

        const el = scrollRef.current
        if (!el) return

        const dx = event.clientX - dragState.current.startX
        if (!dragState.current.didDrag && Math.abs(dx) > DRAG_THRESHOLD_PX) {
            dragState.current.didDrag = true
            setIsDragging(true)
        }

        if (dragState.current.didDrag) {
            el.scrollLeft = dragState.current.scrollLeft - dx
            const now = performance.now()
            const dt = now - dragState.current.lastTime
            if (dt > 0) {
                dragState.current.velocity =
                    (event.clientX - dragState.current.lastX) / dt
            }
            dragState.current.lastX = event.clientX
            dragState.current.lastTime = now
            event.preventDefault()
        }
    }, [])

    const onPointerUp = useCallback(
        (event: React.PointerEvent<HTMLDivElement>) => {
            if (event.pointerType === 'touch') return
            if (!dragState.current.active) return

            dragState.current.active = false
            setIsDragging(false)

            if (scrollRef.current?.hasPointerCapture(event.pointerId)) {
                scrollRef.current.releasePointerCapture(event.pointerId)
            }

            if (dragState.current.didDrag) {
                startMomentum()
            }
        },
        [startMomentum]
    )

    const onClickCapture = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
        if (isInteractiveTarget(event.target)) return
        if (dragState.current.didDrag) {
            event.preventDefault()
            event.stopPropagation()
            dragState.current.didDrag = false
        }
    }, [])

    const scroll = (direction: 'left' | 'right') => {
        stopMomentum()
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
                className={cn(
                    'flex flex-1 gap-2 min-w-0 overflow-x-auto scrollbar-hide snap-x snap-mandatory touch-pan-x',
                    isDragging ? 'cursor-grabbing select-none' : 'cursor-grab'
                )}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onClickCapture={onClickCapture}
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
