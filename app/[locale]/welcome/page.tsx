import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Button } from '@/components/ui/Button'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getDictionary, translate } from '@/lib/i18n/get-dictionary'
import { localizedPath } from '@/lib/i18n/routing'

export default async function WelcomePage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale: raw } = await params
    if (!isLocale(raw)) notFound()

    const locale = raw as Locale
    const messages = getDictionary(locale)
    const t = (key: string) => translate(messages, key)

    const links = [
        { href: localizedPath('/watchlist', locale), label: t('auth.welcomeWatchlist') },
        { href: localizedPath('/portfolio', locale), label: t('auth.welcomePortfolio') },
        { href: localizedPath('/alerts', locale), label: t('auth.welcomeAlerts') },
    ]

    return (
        <div className="max-w-md mx-auto mt-12">
            <div className="bg-surface border border-border rounded-2xl p-8 shadow-sm space-y-6">
                <header className="space-y-2">
                    <h1 className="text-2xl font-bold font-heading text-text-primary tracking-tight">
                        {t('auth.welcomeTitle')}
                    </h1>
                    <p className="text-sm text-text-secondary">{t('auth.welcomeBody')}</p>
                </header>

                <div className="flex flex-col gap-3">
                    {links.map((link) => (
                        <Link key={link.href} href={link.href} className="inline-flex">
                            <Button className="w-full">{link.label}</Button>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    )
}
