"use client"

import { useState, useRef, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import { cn, formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import { PriceChangeBadge } from '@/components/ui/Badge'
import { StockSummary } from '@/lib/types'

export function SearchBar({ className, items = [] }: { className?: string, items?: StockSummary[] }) {
    const router = useRouter()
    const containerRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const [query, setQuery] = useState('')
    const [activeTab, setActiveTab] = useState('All')
    const [isOpen, setIsOpen] = useState(false)
    const [focusedIndex, setFocusedIndex] = useState(-1)

    const tabs = ['All', 'Index', 'Stock']

    // Close on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [])

    const filteredData = useMemo(() => {
        if (!items || items.length === 0) return []

        return items.filter(item => {
            const itemType = item.type || 'Stock'
            const matchesTab = activeTab === 'All'
                ? true
                : activeTab === itemType

            const matchesQuery = query === ''
                ? true
                : item.name.toLowerCase().includes(query.toLowerCase()) ||
                item.code.toLowerCase().includes(query.toLowerCase())

            return matchesTab && matchesQuery
        }).slice(0, 50) // Limit results for performance
    }, [query, activeTab, items])

    const handleSelect = (item: StockSummary) => {
        if (item.type === 'Index') {
            router.push(`/market/${item.code}`)
        } else {
            router.push(`/stock/${item.code}`)
        }

        setQuery('')
        setIsOpen(false)
        setFocusedIndex(-1)
        inputRef.current?.blur()
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) {
            if (e.key === 'ArrowDown' || e.key === 'Enter') {
                setIsOpen(true)
            }
            return
        }

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault()
                setFocusedIndex(prev => Math.min(prev + 1, filteredData.length - 1))
                break
            case 'ArrowUp':
                e.preventDefault()
                setFocusedIndex(prev => Math.max(prev - 1, -1))
                break
            case 'Enter':
                e.preventDefault()
                if (focusedIndex >= 0 && filteredData[focusedIndex]) {
                    handleSelect(filteredData[focusedIndex])
                }
                break
            case 'Escape':
                setIsOpen(false)
                inputRef.current?.blur()
                break
        }
    }

    return (
        <div ref={containerRef} className={cn("relative w-full", className)}>
            <div className={cn(
                "relative flex items-center w-full transition-all duration-300",
                isOpen ? "shadow-lg rounded-t-2xl bg-surface border-x border-t border-border z-50" : "shadow-none"
            )}>
                <Search className={cn(
                    "absolute left-4 h-5 w-5 transition-colors",
                    isOpen ? "text-brand-600 dark:text-brand-400" : "text-text-tertiary"
                )} />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search for stocks, ETFs & more"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value)
                        setIsOpen(true)
                        setFocusedIndex(-1)
                    }}
                    onFocus={() => setIsOpen(true)}
                    onClick={() => setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    className={cn(
                        "h-11 w-full border-none bg-transparent pl-12 pr-12 text-sm font-medium text-text-primary outline-none transition-all placeholder:text-text-tertiary",
                        !isOpen && "bg-surface-secondary rounded-full border border-transparent hover:bg-surface-tertiary hover:shadow-sm"
                    )}
                />
                {query && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 h-8 w-8 text-text-tertiary hover:text-text-primary"
                        onClick={(e) => {
                            e.stopPropagation()
                            setQuery('')
                            inputRef.current?.focus()
                        }}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-surface border-x border-b border-border rounded-b-2xl shadow-xl overflow-hidden z-20">
                    {/* Tabs */}
                    <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto scrollbar-hide">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={(e) => {
                                    e.preventDefault()
                                    setActiveTab(tab)
                                    inputRef.current?.focus()
                                }}
                                className={cn(
                                    "px-3 py-1.5 rounded-full text-xs font-bold transition-all duration-200 whitespace-nowrap",
                                    activeTab === tab
                                        ? "bg-brand-50 text-brand-700 dark:bg-brand-500/10 dark:text-brand-400"
                                        : "text-text-tertiary hover:bg-surface-secondary hover:text-text-secondary"
                                )}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Info */}
                    <div className="px-4 py-3 flex items-center gap-2 text-xs text-text-tertiary">
                        <span>About these suggestions</span>
                        <div className="h-4 w-4 rounded-full border border-text-tertiary/30 flex items-center justify-center text-[10px] font-mono cursor-help">i</div>
                    </div>

                    {/* List */}
                    <div className="max-h-[400px] overflow-y-auto">
                        {filteredData.length > 0 ? (
                            filteredData.map((item, index) => (
                                <div
                                    key={item.code}
                                    className={cn(
                                        "px-4 py-3 transition-colors cursor-pointer group flex items-center justify-between",
                                        index === focusedIndex ? "bg-surface-secondary" : "hover:bg-surface-secondary"
                                    )}
                                    onMouseEnter={() => setFocusedIndex(index)}
                                    onClick={() => handleSelect(item)}
                                >
                                    <div className="flex flex-col gap-0.5">
                                        <span className="text-sm font-medium text-text-primary">
                                            {item.name}
                                        </span>
                                        <span className="text-xs text-text-tertiary font-bold tracking-wider">
                                            {item.code} <span className="font-normal opacity-50">• {(item.type || 'Stock').toUpperCase()}</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm font-mono font-medium text-text-primary">
                                            {formatPrice(item.price)}
                                        </span>
                                        <PriceChangeBadge change={item.changePercent} variant="pill" />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="px-4 py-8 text-center text-sm text-text-tertiary">
                                No results found for {activeTab}
                            </div>
                        )}
                    </div>

                    {/* Footer hint */}
                    <div className="bg-surface-secondary/30 px-4 py-2 text-[10px] text-text-tertiary border-t border-border text-center">
                        Press <kbd className="font-sans px-1 py-0.5 rounded bg-surface border border-border mx-1">Enter</kbd> to see all results
                    </div>
                </div>
            )}
        </div>
    )
}
