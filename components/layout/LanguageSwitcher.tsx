'use client'

import { usePathname, useRouter } from 'next/navigation'
import { useLocale } from '@/components/providers/LocaleProvider'
import { usePreferencesStore } from '@/lib/stores/preferences'
import { switchLocalePath } from '@/lib/i18n/routing'
import type { Locale } from '@/lib/i18n/config'
import { cn } from '@/lib/utils'

export function LanguageSwitcher({ className }: { className?: string }) {
    const pathname = usePathname()
    const router = useRouter()
    const { locale, t } = useLocale()
    const setPreferences = usePreferencesStore((s) => s.setPreferences)

    const switchTo = (target: Locale) => {
        if (target === locale) return
        setPreferences({ locale: target })
        router.push(switchLocalePath(pathname, target))
    }

    return (
        <div
            className={cn(
                'inline-flex items-center rounded-lg border border-white/15 bg-white/5 p-0.5 text-[11px] font-data',
                className
            )}
            role="group"
            aria-label={t('nav.language')}
        >
            <button
                type="button"
                onClick={() => switchTo('mk')}
                className={cn(
                    'px-2 py-1 rounded-md min-h-[32px] transition-colors',
                    locale === 'mk'
                        ? 'bg-accent/20 text-accent'
                        : 'text-talir-gold-soft/80 hover:text-talir-ivory'
                )}
            >
                MK
            </button>
            <button
                type="button"
                onClick={() => switchTo('en')}
                className={cn(
                    'px-2 py-1 rounded-md min-h-[32px] transition-colors',
                    locale === 'en'
                        ? 'bg-accent/20 text-accent'
                        : 'text-talir-gold-soft/80 hover:text-talir-ivory'
                )}
            >
                EN
            </button>
        </div>
    )
}
