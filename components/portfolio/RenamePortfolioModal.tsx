// ... imports
import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"

interface RenamePortfolioModalProps {
    isOpen: boolean
    onClose: () => void
    onRename: (newName: string) => void
    currentName: string
}

export function RenamePortfolioModal({ isOpen, onClose, onRename, currentName }: RenamePortfolioModalProps) {
    const [name, setName] = useState(currentName)

    useEffect(() => {
        setName(currentName)
    }, [currentName, isOpen])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (name.trim()) {
            onRename(name)
            onClose()
        }
    }

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Rename Portfolio"
            className="sm:max-w-[425px]"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">Portfolio Name</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="e.g. Retirement Fund"
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={!name.trim()}>
                        Save Changes
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
