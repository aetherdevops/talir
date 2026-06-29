'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'

interface ImportLocalDataModalProps {
    isOpen: boolean
    onImport: () => void
    onSkip: () => void
}

export function ImportLocalDataModal({ isOpen, onImport, onSkip }: ImportLocalDataModalProps) {
    return (
        <Modal isOpen={isOpen} onClose={onSkip} title="Import saved data?">
            <div className="space-y-4 pt-2">
                <p className="text-sm text-text-secondary">
                    We found alerts, portfolios, or watchlists saved on this device. Import them into your account?
                </p>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onSkip}>
                        Skip
                    </Button>
                    <Button onClick={onImport}>
                        Import data
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
