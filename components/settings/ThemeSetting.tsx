'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useThemeStore } from '@/lib/store'
import { cn } from '@/lib/utils'

export function ThemeSetting() {
    const { theme, setTheme } = useThemeStore()
    const [mounted, setMounted] = useState(false)

    useEffect(() => {
        setMounted(true)
    }, [])

    if (!mounted) {
        return (
            <div className="grid grid-cols-2 gap-3">
                <div className="h-20 rounded-xl bg-surface-secondary animate-pulse" />
                <div className="h-20 rounded-xl bg-surface-secondary animate-pulse" />
            </div>
        )
    }

    const options = [
        { value: 'dark' as const, label: 'Dark', icon: Moon },
        { value: 'light' as const, label: 'Light', icon: Sun },
    ]

    return (
        <div className="grid grid-cols-2 gap-3">
            {options.map(({ value, label, icon: Icon }) => {
                const selected = theme === value
                return (
                    <button
                        key={value}
                        type="button"
                        onClick={() => setTheme(value)}
                        className={cn(
                            'flex flex-col items-center justify-center gap-2 rounded-xl border p-4 transition-all',
                            selected
                                ? 'border-accent bg-accent-muted text-accent'
                                : 'border-border bg-surface hover:bg-surface-secondary text-text-secondary'
                        )}
                        aria-pressed={selected}
                    >
                        <Icon className="h-5 w-5" />
                        <span className="text-sm font-medium">{label}</span>
                    </button>
                )
            })}
        </div>
    )
}
