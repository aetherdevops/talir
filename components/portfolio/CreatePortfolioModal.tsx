
import { useState } from 'react'
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"

interface CreatePortfolioModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (name: string) => void
}

export function CreatePortfolioModal({ isOpen, onClose, onCreate }: CreatePortfolioModalProps) {
    const [name, setName] = useState('')

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onCreate(name.trim())
            setName('')
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Create new portfolio">
            <form onSubmit={handleSubmit} className="pt-4 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wide">Portfolio Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-secondary/50 p-3 text-text-primary outline-none focus:border-brand-500"
                        placeholder="e.g. Retirement, Tech Stocks"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Create</Button>
                </div>
            </form>
        </Modal>
    )
}
