"use client"

import { useAlertsStore, Alert } from '@/lib/stores/alerts'
import { Bell, Trash2, ArrowUpRight, ArrowDownRight, Clock, Pencil } from 'lucide-react'
import { formatPrice } from '@/lib/utils'
import { Button } from '@/components/ui/Button'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { AddAlertModal } from '@/components/stock/AddAlertModal'

export function AlertsClient() {
    const { alerts, removeAlert, toggleAlert } = useAlertsStore()
    const [mounted, setMounted] = useState(false)
    const [editingAlert, setEditingAlert] = useState<Alert | null>(null)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) return null

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8">
            <header>
                <h1 className="text-3xl font-bold text-text-primary mb-2">My Alerts</h1>
                <p className="text-text-secondary">Manage and track your price notifications.</p>
            </header>

            {alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-surface rounded-2xl border border-border dashed">
                    <div className="w-16 h-16 bg-surface-secondary rounded-full flex items-center justify-center text-text-tertiary mb-4">
                        <Bell className="h-8 w-8" />
                    </div>
                    <h3 className="text-lg font-bold text-text-primary mb-2">No active alerts</h3>
                    <p className="text-text-secondary max-w-sm text-center mb-6">
                        You haven't set any price alerts yet. Go to a stock page to create one.
                    </p>
                    <Link href="/markets">
                        <Button>Browse Markets</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-4">
                    {alerts.map((alert) => (
                        <div
                            key={alert.id}
                            className="bg-surface border border-border rounded-xl p-5 flex items-center justify-between group hover:border-brand-500/30 transition-all"
                        >
                            <div className="flex items-center gap-5">
                                {/* Toggle Switch */}
                                <button
                                    onClick={() => toggleAlert(alert.id)}
                                    className={`w-12 h-6 rounded-full transition-all relative ${alert.isActive ? 'bg-brand-500' : 'bg-surface-tertiary'
                                        }`}
                                >
                                    <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${alert.isActive ? 'translate-x-6' : 'translate-x-0'
                                        }`} />
                                </button>

                                {/* Symbol Info */}
                                <div>
                                    <Link href={`/stock/${alert.symbol}`} className="font-bold text-lg text-text-primary hover:text-brand-500 transition-colors">
                                        {alert.symbol}
                                    </Link>
                                    <div className="flex items-center gap-2 text-xs text-text-tertiary mt-1">
                                        <Clock className="h-3 w-3" />
                                        {alert.expiration.isOpenEnded
                                            ? 'Open-ended'
                                            : `Expires ${alert.expiration.date} ${alert.expiration.time}`
                                        }
                                    </div>
                                </div>

                                {/* Divider */}
                                <div className="h-8 w-px bg-border mx-2" />

                                {/* Conditions */}
                                <div className="flex flex-wrap gap-2">
                                    {alert.conditions.map((cond, idx) => (
                                        <div
                                            key={idx}
                                            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 border ${cond.type === 'above'
                                                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
                                                : 'bg-red-500/10 text-red-500 border-red-500/20'
                                                }`}
                                        >
                                            {cond.type === 'above'
                                                ? <ArrowUpRight className="h-3.5 w-3.5" />
                                                : <ArrowDownRight className="h-3.5 w-3.5" />
                                            }
                                            {formatPrice(cond.value)}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-text-tertiary hover:text-text-primary hover:bg-surface-secondary"
                                    onClick={() => setEditingAlert(alert)}
                                >
                                    <Pencil className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="text-text-tertiary hover:text-red-500 hover:bg-red-500/10"
                                    onClick={() => removeAlert(alert.id)}
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {editingAlert && (
                <AddAlertModal
                    isOpen={!!editingAlert}
                    onClose={() => setEditingAlert(null)}
                    symbol={editingAlert.symbol}
                    currentPrice={editingAlert.conditions[0]?.value || 0}
                    initialData={editingAlert}
                />
            )}
        </div>
    )
}
