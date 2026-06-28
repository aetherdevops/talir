
import { useState, useMemo } from 'react'
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Search } from "lucide-react"
import { usePortfolioStore } from "@/lib/stores/portfolio"
import { StockSummary } from "@/lib/types"

interface AddHoldingModalProps {
    isOpen: boolean
    onClose: () => void
    allStocks: StockSummary[]
    portfolioId?: string
    initialStockCode?: string
}

export function AddHoldingModal({ isOpen, onClose, allStocks, portfolioId, initialStockCode }: AddHoldingModalProps) {
    const { addHolding } = usePortfolioStore()
    const [step, setStep] = useState<'search' | 'details'>('search')
    const [selectedStock, setSelectedStock] = useState<StockSummary | null>(null)
    const [query, setQuery] = useState('')

    // Form fields
    const [quantity, setQuantity] = useState('')
    const [buyPrice, setBuyPrice] = useState('')
    const [buyDate, setBuyDate] = useState(() => new Date().toISOString().split('T')[0])

    useMemo(() => {
        if (isOpen && initialStockCode) {
            const stock = allStocks.find(s => s.code === initialStockCode)
            if (stock) {
                setSelectedStock(stock)
                setBuyPrice(stock.price.toString())
                setStep('details')
            }
        } else if (isOpen) {
            // Reset if opening effectively new
            // Logic to reset is handled in submission, but maybe needed here if reopening without submission?
            if (!initialStockCode && step === 'details' && !selectedStock) {
                setStep('search')
            }
        }
    }, [isOpen, initialStockCode, allStocks]) // eslint-disable-next-line react-hooks/exhaustive-deps

    // Reset when closed
    useMemo(() => {
        if (!isOpen) {
            // Optional: reset state here if desired, otherwise handled in submit/close handler
        }
    }, [isOpen])

    const filteredStocks = useMemo(() => {
        if (!query) return []
        const lowerQ = query.toLowerCase()
        return allStocks.filter(s =>
            s.name.toLowerCase().includes(lowerQ) ||
            s.code.toLowerCase().includes(lowerQ)
        ).slice(0, 5)
    }, [query, allStocks])

    const handleSelectStock = (stock: StockSummary) => {
        setSelectedStock(stock)
        setBuyPrice(stock.price.toString())
        setStep('details')
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedStock && quantity && buyPrice && buyDate && portfolioId) {
            addHolding(portfolioId, {
                code: selectedStock.code,
                quantity: Number(quantity),
                buyPrice: Number(buyPrice),
                buyDate: buyDate
            })
            // Reset and close
            setStep('search')
            setQuery('')
            setQuantity('')
            setBuyPrice('')
            setSelectedStock(null)
            onClose()
        }
    }

    const handleBack = () => {
        setStep('search')
        setSelectedStock(null)
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={step === 'search' ? "Select Investment" : "Add Holding Details"}>
            <div className="pt-2">
                {step === 'search' ? (
                    <div className="space-y-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-text-tertiary" />
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search by ticker or name"
                                autoFocus
                                className="w-full rounded-xl border border-border bg-surface-secondary/50 pl-10 pr-4 py-3 text-text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                            />
                        </div>
                        <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
                            {filteredStocks.map(stock => (
                                <div
                                    key={stock.code}
                                    className="flex items-center justify-between p-3 hover:bg-surface-secondary rounded-lg transition-colors cursor-pointer"
                                    onClick={() => handleSelectStock(stock)}
                                >
                                    <div>
                                        <div className="font-bold text-sm text-text-primary">{stock.code}</div>
                                        <div className="text-xs text-text-secondary">{stock.name}</div>
                                    </div>
                                    <div className="text-sm font-mono">{stock.price.toLocaleString()} MKD</div>
                                </div>
                            ))}
                            {query && filteredStocks.length === 0 && (
                                <div className="text-center py-8 text-text-tertiary">No stocks found</div>
                            )}
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center justify-between bg-surface-secondary/50 p-4 rounded-xl border border-border">
                            <div>
                                <div className="font-bold text-lg text-text-primary">{selectedStock?.code}</div>
                                <div className="text-xs text-text-secondary">{selectedStock?.name}</div>
                            </div>
                            <Button type="button" variant="ghost" size="sm" onClick={handleBack}>Change</Button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wide">Quantity</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1"
                                    required
                                    value={quantity}
                                    onChange={(e) => setQuantity(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-surface-secondary/50 p-3 text-text-primary outline-none focus:border-brand-500"
                                    placeholder="0"
                                    autoFocus
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wide">Buy Price (MKD)</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    required
                                    value={buyPrice}
                                    onChange={(e) => setBuyPrice(e.target.value)}
                                    className="w-full rounded-xl border border-border bg-surface-secondary/50 p-3 text-text-primary outline-none focus:border-brand-500"
                                    placeholder="0.00"
                                    onFocus={(e) => e.target.select()}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wide">Date Bought</label>
                            <input
                                type="date"
                                required
                                value={buyDate}
                                onChange={(e) => setBuyDate(e.target.value)}
                                className="w-full rounded-xl border border-border bg-surface-secondary/50 p-3 text-text-primary outline-none focus:border-brand-500"
                            />
                        </div>

                        <div className="flex justify-end gap-3 pt-4 border-t border-border">
                            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                            <Button type="submit">Add Holding</Button>
                        </div>
                    </form>
                )}
            </div>
        </Modal>
    )
}
