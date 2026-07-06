'use client'

import { usePathname } from 'next/navigation'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { LocaleProvider, useLocale, useLocaleOptional } from '@/components/providers/LocaleProvider'
import { defaultLocale } from '@/lib/i18n/config'
import { parsePathname } from '@/lib/i18n/routing'

function NotFoundBody() {
    const { t } = useLocale()

    return (
        <div className="flex h-[calc(100vh-8rem)] w-full flex-col items-center justify-center text-center animate-fade-in font-sans">
            <div className="relative mb-8">
                <div className="absolute inset-0 animate-pulse rounded-full bg-accent/20 blur-xl" />
                <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-surface-secondary shadow-lg">
                    <FileQuestion className="h-16 w-16 text-accent" />
                </div>
            </div>

            <h2 className="text-4xl font-bold tracking-tight text-text-primary mb-3">{t('notFound.title')}</h2>
            <p className="text-text-secondary max-w-md mb-8 leading-relaxed">{t('notFound.body')}</p>

            <div className="flex gap-4">
                <LocaleLink href="/">
                    <Button size="lg" className="rounded-full px-8 shadow-lg shadow-accent/20">
                        {t('notFound.home')}
                    </Button>
                </LocaleLink>
                <LocaleLink href="/markets">
                    <Button variant="secondary" size="lg" className="rounded-full px-8">
                        {t('notFound.markets')}
                    </Button>
                </LocaleLink>
            </div>
        </div>
    )
}

export function NotFoundContent() {
    const pathname = usePathname()
    const ctx = useLocaleOptional()
    const locale = ctx?.locale ?? parsePathname(pathname ?? '/').locale ?? defaultLocale

    if (ctx) {
        return <NotFoundBody />
    }

    return (
        <LocaleProvider locale={locale}>
            <NotFoundBody />
        </LocaleProvider>
    )
}
