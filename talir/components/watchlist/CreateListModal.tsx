
import { useState } from 'react'
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"

interface CreateListModalProps {
    isOpen: boolean
    onClose: () => void
    onCreate: (name: string) => void
}

export function CreateListModal({ isOpen, onClose, onCreate }: CreateListModalProps) {
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
        <Modal isOpen={isOpen} onClose={onClose} title="Create new list">
            <form onSubmit={handleSubmit} className="space-y-6 pt-2">
                <div>
                    <label className="block text-sm font-bold text-text-secondary mb-2 uppercase tracking-wide">List Name</label>
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Dividend Stocks"
                        autoFocus
                        className="w-full rounded-xl border border-border bg-surface-secondary/50 p-3 text-text-primary focus:border-brand-500 focus:ring-1 focus:ring-brand-500 outline-none transition-all"
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit" disabled={!name.trim()}>Create</Button>
                </div>
            </form>
        </Modal>
    )
}
