
"use client"

import { useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Bell, ChevronDown, Calendar as CalendarIcon, Clock, Plus, X } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { useAlertsStore, Alert } from '@/lib/stores/alerts'
import { useRequireAuth } from '@/lib/auth/use-require-auth'
import { useLocale } from '@/components/providers/LocaleProvider'

interface AddAlertModalProps {
    isOpen: boolean
    onClose: () => void
    symbol: string
    currentPrice: number
    initialData?: Alert
}

export function AddAlertModal({ isOpen, onClose, symbol, currentPrice, initialData }: AddAlertModalProps) {
    const { t } = useLocale()
    const { addAlert, updateAlert } = useAlertsStore()
    const { requireAuth } = useRequireAuth()
    const isEditing = !!initialData

    const [conditions, setConditions] = useState<{ type: 'above' | 'below', value: string }[]>(
        initialData?.conditions.map(c => ({ type: c.type, value: c.value.toString() })) ||
        [{ type: 'above', value: currentPrice.toString() }]
    )

    const defaultDate = new Date()
    defaultDate.setFullYear(defaultDate.getFullYear() + 1)

    const [isOpenEnded, setIsOpenEnded] = useState(initialData?.expiration.isOpenEnded ?? false)
    const [expirationDate, setExpirationDate] = useState(initialData?.expiration.date ?? defaultDate.toISOString().split('T')[0])
    const [expirationTime, setExpirationTime] = useState(initialData?.expiration.time ?? '12:00')

    const [isSubmitting, setIsSubmitting] = useState(false)

    const addCondition = () => {
        if (conditions.length >= 2) return
        setConditions([...conditions, { type: 'above', value: currentPrice.toString() }])
    }

    const removeCondition = (index: number) => {
        if (conditions.length > 1) {
            setConditions(conditions.filter((_, i) => i !== index))
        }
    }

    const updateCondition = (index: number, field: 'type' | 'value', val: string) => {
        const newConditions = [...conditions]
        newConditions[index] = { ...newConditions[index], [field]: val }
        setConditions(newConditions)
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        if (!requireAuth()) return

        setIsSubmitting(true)

        const alertData = {
            symbol,
            conditions: conditions.map(c => ({
                type: c.type,
                value: parseFloat(c.value) || 0
            })),
            expiration: {
                isOpenEnded,
                date: isOpenEnded ? undefined : expirationDate,
                time: isOpenEnded ? undefined : expirationTime
            },
        }

        if (isEditing && initialData) {
            updateAlert(initialData.id, { ...alertData, triggeredAt: null, isActive: true })
        } else {
            addAlert(alertData)
        }

        setIsSubmitting(false)
        onClose()
    }

    const title = isEditing
        ? t('alerts.editTitle', { symbol })
        : t('alerts.createTitle', { symbol })

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <form onSubmit={handleSubmit} className="flex flex-col h-full space-y-6 pt-2">
                <div className="bg-surface-secondary/50 px-4 py-3 rounded-lg flex items-center gap-3 border border-border">
                    <div className="w-8 h-8 rounded-full bg-brand-500/10 text-brand-500 flex items-center justify-center">
                        <Bell className="h-4 w-4" />
                    </div>
                    <div>
                        <div className="font-bold text-text-primary text-sm">{symbol}</div>
                        <div className="text-xs text-text-secondary">
                            {t('alerts.currentPrice', { price: formatPrice(currentPrice) })}
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-text-secondary">{t('alerts.priceLabel')}</label>
                        {conditions.length < 2 && (
                            <button
                                type="button"
                                onClick={addCondition}
                                className="text-xs text-brand-500 hover:text-brand-400 font-medium flex items-center gap-1"
                            >
                                <Plus className="h-3 w-3" /> {t('alerts.addCondition')}
                            </button>
                        )}
                    </div>

                    <div className="space-y-2">
                        {conditions.map((condition, idx) => (
                            <div key={idx} className="flex gap-2 items-center group">
                                <div className="flex-1 flex gap-2">
                                    <div className="relative min-w-[140px]">
                                        <select
                                            value={condition.type}
                                            onChange={(e) => updateCondition(idx, 'type', e.target.value)}
                                            className="w-full appearance-none bg-surface border border-border rounded-lg pl-3 pr-8 py-2 text-sm text-text-primary focus:ring-1 focus:ring-brand-500 outline-none"
                                        >
                                            <option value="above">{t('alerts.greaterThan')}</option>
                                            <option value="below">{t('alerts.lessThan')}</option>
                                        </select>
                                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-text-tertiary pointer-events-none" />
                                    </div>
                                    <div className="relative flex-1">
                                        <input
                                            type="number"
                                            value={condition.value}
                                            onChange={(e) => updateCondition(idx, 'value', e.target.value)}
                                            className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-brand-500 outline-none"
                                            placeholder={t('alerts.pricePlaceholder')}
                                        />
                                    </div>
                                </div>
                                {conditions.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => removeCondition(idx)}
                                        className="p-2 text-text-tertiary hover:text-red-500 hover:bg-surface-secondary rounded-lg transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-text-secondary">{t('alerts.expiration')}</label>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-text-secondary">{t('alerts.openEnded')}</span>
                            <button
                                type="button"
                                onClick={() => setIsOpenEnded(!isOpenEnded)}
                                className={cn(
                                    "w-9 h-5 rounded-full transition-colors relative",
                                    isOpenEnded ? "bg-brand-500" : "bg-surface-tertiary"
                                )}
                            >
                                <div className={cn(
                                    "absolute top-1 left-1 bg-surface-elevated w-3 h-3 rounded-full transition-transform shadow-sm",
                                    isOpenEnded ? "translate-x-4" : "translate-x-0"
                                )} />
                            </button>
                        </div>
                    </div>

                    {!isOpenEnded && (
                        <div className="flex gap-2 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="relative flex-1">
                                <input
                                    type="date"
                                    value={expirationDate}
                                    onChange={(e) => setExpirationDate(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-brand-500 outline-none dark:[color-scheme:dark]"
                                />
                                <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                            </div>
                            <div className="relative w-1/3">
                                <input
                                    type="time"
                                    value={expirationTime}
                                    onChange={(e) => setExpirationTime(e.target.value)}
                                    className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-text-primary focus:ring-1 focus:ring-brand-500 outline-none dark:[color-scheme:dark]"
                                />
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-text-tertiary pointer-events-none" />
                            </div>
                        </div>
                    )}
                </div>

                <p className="text-xs text-text-tertiary border-t border-border pt-4">
                    {t('alerts.notifyHint')}
                </p>

                <div className="flex gap-3 pt-2">
                    <Button variant="ghost" className="flex-1" onClick={onClose} type="button">
                        {t('common.cancel')}
                    </Button>
                    <Button className="flex-1" type="submit" disabled={isSubmitting}>
                        {isSubmitting
                            ? t('alerts.saving')
                            : isEditing
                              ? t('alerts.updateAlert')
                              : t('alerts.createAlert')}
                    </Button>
                </div>
            </form>
        </Modal>
    )
}
