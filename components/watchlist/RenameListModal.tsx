
import { useState, useEffect } from 'react'
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { useWatchlistStore } from "@/lib/stores/watchlist"

interface RenameListModalProps {
    isOpen: boolean
    onClose: () => void
    listId: string
    currentName: string
}

export function RenameListModal({ isOpen, onClose, listId, currentName }: RenameListModalProps) {
    const { renameList } = useWatchlistStore()
    const [name, setName] = useState(currentName)

    useEffect(() => {
        setName(currentName)
    }, [currentName, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            renameList(listId, name.trim())
            onClose()
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Rename list">
            <form onSubmit={handleSubmit} className="pt-4 space-y-4">
                <div>
                    <label className="block text-xs font-bold text-text-secondary mb-1 uppercase tracking-wide">List Name</label>
                    <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full rounded-xl border border-border bg-surface-secondary/50 p-3 text-text-primary outline-none focus:border-brand-500"
                        placeholder="My Watchlist"
                        autoFocus
                        onFocus={(e) => e.target.select()}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
                    <Button type="submit">Save</Button>
                </div>
            </form>
        </Modal>
    )
}
