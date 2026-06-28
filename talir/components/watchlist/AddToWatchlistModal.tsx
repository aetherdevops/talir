
import { useState, useMemo } from 'react'
import { Modal } from "@/components/ui/Modal"
import { Search, Plus } from "lucide-react"
import { useWatchlistStore } from "@/lib/stores/watchlist"
import { StockSummary } from "@/lib/types"

interface AddToWatchlistModalProps {
    isOpen: boolean
    onClose: () => void
    listId: string
    allStocks: StockSummary[]
}

export function AddToWatchlistModal({ isOpen, onClose, listId, allStocks }: AddToWatchlistModalProps) {
    const { addToList } = useWatchlistStore()
    const [query, setQuery] = useState('')

    // Reset query when closed
    useMemo(() => {
        if (!isOpen) {
            setQuery('')
        }
    }, [isOpen])

    const filteredStocks = useMemo(() => {
        if (!query) return []
        const lowerQ = query.toLowerCase()
        return allStocks.filter(s =>
            s.name.toLowerCase().includes(lowerQ) ||
            s.code.toLowerCase().includes(lowerQ)
        ).slice(0, 10) // Show top 10 results
    }, [query, allStocks])

    const handleSelectStock = (stock: StockSummary) => {
        addToList(listId, stock.code)
        setQuery('')
        onClose()
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add to Watchlist">
            <div className="pt-2 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-text-tertiary" />
                    <input
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Search by ticker or name to add..."
                        autoFocus
                        className="w-full rounded-xl border border-border bg-surface-secondary/50 pl-10 pr-4 py-3 text-text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>

                <div className="min-h-[200px] max-h-[300px] overflow-y-auto -mx-2 px-2">
                    {filteredStocks.length > 0 ? (
                        filteredStocks.map(stock => (
                            <div
                                key={stock.code}
                                className="flex items-center justify-between p-3 hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer group"
                                onClick={() => handleSelectStock(stock)}
                            >
                                <div>
                                    <div className="font-bold text-sm text-text-primary flex items-center gap-2">
                                        {stock.code}
                                        <span className="text-xs font-normal text-text-tertiary border border-border px-1.5 rounded">{stock.name}</span>
                                    </div>
                                    <div className="text-sm font-mono mt-0.5">{stock.price.toLocaleString()} MKD</div>
                                </div>
                                <div className="text-brand-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Plus className="w-5 h-5" />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-12 text-text-tertiary">
                            {query ? 'No stocks found' : 'Start typing to search...'}
                        </div>
                    )}
                </div>
            </div>
        </Modal>
    )
}
