'use client'

import { useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input, type InputProps } from '@/components/ui/Input'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

export function PasswordInput({ className, ...props }: InputProps) {
    const { t } = useLocale()
    const [visible, setVisible] = useState(false)

    return (
        <div className="relative">
            <Input
                {...props}
                type={visible ? 'text' : 'password'}
                className={cn('min-h-[44px] pr-11', className)}
            />
            <button
                type="button"
                className="absolute right-0.5 top-1/2 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-md text-text-tertiary hover:text-text-primary transition-colors"
                aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
                aria-pressed={visible}
                onClick={() => setVisible((v) => !v)}
            >
                {visible ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
            </button>
        </div>
    )
}
