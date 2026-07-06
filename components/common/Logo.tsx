'use client'

import { cn } from '@/lib/utils'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { TalirMark } from '@/components/common/TalirMark'
import { useLocale } from '@/components/providers/LocaleProvider'

interface LogoProps {
    className?: string
    compact?: boolean
}

export function Logo({ className, compact = false }: LogoProps) {
    const { t } = useLocale()

    return (
        <LocaleLink
            href="/"
            className={cn('flex items-center gap-2.5 min-h-[44px] min-w-0 group', className)}
        >
            <TalirMark size={compact ? 32 : 40} className="talir-logo-mark shrink-0" />
            {!compact && (
                <div className="hidden min-[360px]:flex items-center leading-none min-w-0">
                    <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-text-primary whitespace-nowrap">
                        {t('brand.wordmark')}
                        <span className="text-accent">.</span>
                    </span>
                </div>
            )}
        </LocaleLink>
    )
}