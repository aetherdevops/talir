'use client'

import { useEffect, useRef, useState } from 'react'
import { Eye, Briefcase, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCreateFlows, CREATE_ACTIONS } from '@/components/layout/useCreateFlows'
import { Modal } from '@/components/ui/Modal'

interface CreateMenuProps {
    open: boolean
    onClose: () => void
    variant: 'sheet' | 'modal'
}

const SWIPE_CLOSE_THRESHOLD = 72

export function CreateMenu({ open, onClose, variant }: CreateMenuProps) {
    const { startWatchlistCreate, startPortfolioCreate, modals } = useCreateFlows()
    const [dragOffset, setDragOffset] = useState(0)
    const dragStartY = useRef<number | null>(null)

    useEffect(() => {
        if (!open || variant !== 'sheet') return
        document.body.style.overflow = 'hidden'
        return () => {
            document.body.style.overflow = ''
        }
    }, [open, variant])

    useEffect(() => {
        if (!open) setDragOffset(0)
    }, [open])

    const handleAction = (id: (typeof CREATE_ACTIONS)[number]['id']) => {
        onClose()
        if (id === 'watchlist') startWatchlistCreate()
        else startPortfolioCreate()
    }

    const handleTouchStart = (event: React.TouchEvent) => {
        dragStartY.current = event.touches[0].clientY
    }

    const handleTouchMove = (event: React.TouchEvent) => {
        if (dragStartY.current === null) return
        const delta = event.touches[0].clientY - dragStartY.current
        setDragOffset(Math.max(0, delta))
    }

    const handleTouchEnd = () => {
        if (dragOffset >= SWIPE_CLOSE_THRESHOLD) onClose()
        dragStartY.current = null
        setDragOffset(0)
    }

    const actionButtons = CREATE_ACTIONS.map(({ id, icon: Icon, title, description }) => (
        <button
            key={id}
            type="button"
            onClick={() => handleAction(id)}
            className={cn(
                'w-full flex items-center gap-4 min-h-[56px] px-4 py-3 rounded-xl',
                'bg-surface-secondary/50 hover:bg-surface-secondary border border-border/60',
                'text-left transition-colors'
            )}
        >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-accent-muted text-accent">
                <Icon className="h-5 w-5" aria-hidden />
            </span>
            <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-semibold text-text-primary">{title}</span>
                <span className="text-xs text-text-secondary">{description}</span>
            </span>
        </button>
    ))

    return (
        <>
            {variant === 'sheet' && open && (
                <div className="fixed inset-0 z-50 md:hidden">
                    <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
                    <div
                        role="dialog"
                        aria-modal="true"
                        aria-label="Create"
                        className="absolute inset-x-0 bottom-0 bg-surface border-t border-border rounded-t-2xl shadow-2xl transition-transform"
                        style={{
                            paddingBottom: 'max(1rem, env(safe-area-inset-bottom))',
                            transform: dragOffset > 0 ? `translateY(${dragOffset}px)` : undefined,
                        }}
                        onTouchStart={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    >
                        <div className="flex justify-center pt-3 pb-1" aria-hidden>
                            <span className="h-1 w-10 rounded-full bg-border-active/80" />
                        </div>
                        <div className="flex items-center justify-between px-4 pt-1 pb-2">
                            <h2 className="text-base font-semibold text-text-primary">Create</h2>
                            <button
                                type="button"
                                onClick={onClose}
                                className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full text-text-secondary hover:bg-surface-secondary"
                                aria-label="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="px-4 pb-4 space-y-2">{actionButtons}</div>
                    </div>
                </div>
            )}

            {variant === 'modal' && (
                <Modal isOpen={open} onClose={onClose} title="Create">
                    <div className="space-y-2 pt-2">{actionButtons}</div>
                </Modal>
            )}

            {modals}
        </>
    )
}
