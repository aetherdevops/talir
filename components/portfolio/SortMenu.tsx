
"use client"

import { Button } from "@/components/ui/Button"
import { ArrowDownWideNarrow, Check } from "lucide-react"
import { useState } from "react"
import { cn } from "@/lib/utils"

export type SortField = 'name' | 'code' | 'price' | 'dailyGain' | 'changePercent' | 'quantity' | 'marketValue'
export type SortDirection = 'asc' | 'desc'

interface SortMenuProps {
    sortField: SortField
    sortDirection: SortDirection
    onSortChange: (field: SortField, direction: SortDirection) => void
}

export function SortMenu({ sortField, sortDirection, onSortChange }: SortMenuProps) {
    const [isOpen, setIsOpen] = useState(false)

    // Option structure based on UI image
    const options: { label: string, value: SortField }[] = [
        { label: 'Name', value: 'name' },
        { label: 'Symbol', value: 'code' },
        { label: 'Price', value: 'price' },
        { label: 'Day change', value: 'dailyGain' },
        { label: 'Day % change', value: 'changePercent' },
        { label: 'Shares', value: 'quantity' },
        { label: 'Value', value: 'marketValue' },
    ]

    return (
        <div className="relative">
            {isOpen && <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />}

            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="text-text-secondary hover:text-text-primary gap-1"
            >
                <ArrowDownWideNarrow className="w-4 h-4" /> Sort
            </Button>

            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl z-20 py-2 animate-in fade-in zoom-in-95 duration-200">
                    <div className="px-4 py-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">Sort by</div>
                    {options.map((option) => (
                        <button
                            key={option.value}
                            className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                            onClick={() => {
                                onSortChange(option.value, sortDirection)
                                setIsOpen(false)
                            }}
                        >
                            <span>{option.label}</span>
                            {sortField === option.value && <Check className="w-4 h-4 text-brand-500" />}
                        </button>
                    ))}

                    <div className="h-px bg-border my-1" />

                    <div className="px-4 py-2 text-xs font-bold text-text-tertiary uppercase tracking-wider">Sort direction</div>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                        onClick={() => {
                            onSortChange(sortField, 'asc')
                            setIsOpen(false)
                        }}
                    >
                        <span>Ascending (A-Z)</span>
                        {sortDirection === 'asc' && <Check className="w-4 h-4 text-brand-500" />}
                    </button>
                    <button
                        className="w-full text-left px-4 py-2 text-sm text-text-secondary hover:bg-surface-secondary hover:text-text-primary transition-colors flex items-center justify-between"
                        onClick={() => {
                            onSortChange(sortField, 'desc')
                            setIsOpen(false)
                        }}
                    >
                        <span>Descending (Z-A)</span>
                        {sortDirection === 'desc' && <Check className="w-4 h-4 text-brand-500" />}
                    </button>
                </div>
            )}
        </div>
    )
}
