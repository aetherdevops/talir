"use client"

import { useState, useEffect } from "react"
import { Modal } from "@/components/ui/Modal"
import { Button } from "@/components/ui/Button"
import { Input } from "@/components/ui/Input"
import { Label } from "@/components/ui/Label"
import { useLocale } from '@/components/providers/LocaleProvider'

interface RenamePortfolioModalProps {
    isOpen: boolean
    onClose: () => void
    onRename: (newName: string) => void
    currentName: string
}

export function RenamePortfolioModal({ isOpen, onClose, onRename, currentName }: RenamePortfolioModalProps) {
    const { t } = useLocale()
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
            title={t('portfolio.renamePortfolioTitle')}
            className="sm:max-w-[425px]"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="name">{t('portfolio.portfolioName')}</Label>
                    <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t('portfolio.renamePlaceholder')}
                        autoFocus
                    />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                    <Button type="button" variant="ghost" onClick={onClose}>
                        {t('common.cancel')}
                    </Button>
                    <Button type="submit" disabled={!name.trim()}>
                        {t('portfolio.saveChanges')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
