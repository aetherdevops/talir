'use client'

import { useState } from 'react'
import { SearchBar } from '@/components/layout/SearchBar'
import { useInstruments } from '@/components/providers/InstrumentsProvider'
import { X } from 'lucide-react'

interface MobileSearchSheetProps {
    open: boolean
    onClose: () => void
}

export function MobileSearchSheet({ open, onClose }: MobileSearchSheetProps) {
    const instruments = useInstruments()

    if (!open) return null

    return (
        <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-x-0 top-0 bg-surface border-b border-border p-4 pb-safe max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-text-primary font-heading">Search</h2>
                    <button
                        type="button"
                        onClick={onClose}
                        className="h-11 w-11 flex items-center justify-center rounded-lg hover:bg-surface-secondary"
                        aria-label="Close search"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <SearchBar items={instruments} className="w-full" />
            </div>
        </div>
    )
}
