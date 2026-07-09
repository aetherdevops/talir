'use client'

import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { useLocale } from '@/components/providers/LocaleProvider'

interface ImportLocalDataModalProps {
    isOpen: boolean
    onImport: () => void
    onSkip: () => void
}

export function ImportLocalDataModal({ isOpen, onImport, onSkip }: ImportLocalDataModalProps) {
    const { t } = useLocale()

    return (
        <Modal isOpen={isOpen} onClose={onSkip} title={t('auth.importTitle')}>
            <div className="space-y-4 pt-2">
                <p className="text-sm text-text-secondary">
                    {t('auth.importBody')}
                </p>
                <div className="flex justify-end gap-3">
                    <Button variant="ghost" onClick={onSkip}>
                        {t('auth.skip')}
                    </Button>
                    <Button onClick={onImport}>
                        {t('auth.importData')}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
