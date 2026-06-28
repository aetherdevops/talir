"use client"

import * as React from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
    isOpen: boolean
    onClose: () => void
    title?: string
    children: React.ReactNode
    className?: string
}

export function Modal({ isOpen, onClose, title, children, className }: ModalProps) {
    const [isRendered, setIsRendered] = React.useState(isOpen)
    const [isVisible, setIsVisible] = React.useState(false)

    React.useEffect(() => {
        if (isOpen) {
            setIsRendered(true)
            // Small timeout to allow render before animation starts
            setTimeout(() => setIsVisible(true), 10)
            document.body.style.overflow = 'hidden'
        } else {
            setIsVisible(false)
            document.body.style.overflow = 'unset'
            // Wait for animation to finish before unmounting
            const timer = setTimeout(() => setIsRendered(false), 300)
            return () => clearTimeout(timer)
        }
    }, [isOpen])

    // Handle ESC key
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
        }
        window.addEventListener('keydown', handleEsc)
        return () => window.removeEventListener('keydown', handleEsc)
    }, [onClose])

    if (!isRendered) return null

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 text-left touch-none">
            {/* Backdrop */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300",
                    isVisible ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Content */}
            <div
                className={cn(
                    "relative w-full max-w-lg transform rounded-xl bg-surface p-6 shadow-2xl transition-all duration-300 dark:bg-dark-surface border border-border-light dark:border-border-dark",
                    isVisible ? "scale-100 opacity-100 translate-y-0" : "scale-95 opacity-0 translate-y-4",
                    className
                )}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    {title && <h2 className="text-xl font-bold font-display text-text-primary">{title}</h2>}
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 text-text-tertiary hover:bg-surface-tertiary hover:text-text-primary dark:hover:bg-dark-elevated transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="max-h-[80vh] overflow-y-auto">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    )
}
