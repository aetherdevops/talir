'use client'

import { useEffect, useRef } from 'react'
import { SearchBar } from '@/components/layout/SearchBar'
import { useInstruments, useSearchIndex } from '@/components/providers/InstrumentsProvider'
import { X } from 'lucide-react'

interface MobileSearchSheetProps {
    open: boolean
    onClose: () => void
}

export function MobileSearchSheet({ open, onClose }: MobileSearchSheetProps) {
    const instruments = useInstruments()
    const { ensureLoaded } = useSearchIndex()
    const dialogRef = useRef<HTMLDivElement>(null)
    const closeButtonRef = useRef<HTMLButtonElement>(null)

    useEffect(() => {
        if (open) ensureLoaded()
    }, [open, ensureLoaded])

    useEffect(() => {
        if (!open || !dialogRef.current) return

        const previouslyFocused = document.activeElement as HTMLElement | null
        document.body.style.overflow = 'hidden'

        const focusTimer = window.setTimeout(() => {
            const input = dialogRef.current?.querySelector<HTMLInputElement>('input[type="text"]')
            if (input) input.focus()
            else closeButtonRef.current?.focus()
        }, 0)

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault()
                onClose()
                return
            }

            if (event.key !== 'Tab') return

            const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )
            if (!focusables?.length) return

            const list = Array.from(focusables).filter(
                (element) => !element.hasAttribute('disabled') && element.tabIndex !== -1
            )
            if (!list.length) return

            const first = list[0]
            const last = list[list.length - 1]

            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault()
                last.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault()
                first.focus()
            }
        }

        document.addEventListener('keydown', handleKeyDown)
        return () => {
            window.clearTimeout(focusTimer)
            document.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = ''
            previouslyFocused?.focus()
        }
    }, [open, onClose])

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-label="Search"
                className="absolute inset-x-0 top-0 bg-surface border-b border-border p-4 pb-safe max-h-[85vh] overflow-y-auto"
            >
                <div className="flex items-center justify-between mb-4">
                    <h2 id="mobile-search-title" className="text-lg font-semibold text-text-primary font-heading">
                        Search
                    </h2>
                    <button
                        ref={closeButtonRef}
                        type="button"
                        onClick={onClose}
                        className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-surface-secondary"
                        aria-label="Close search"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <SearchBar items={instruments} className="w-full" autoFocus />
            </div>
        </div>
    )
}
