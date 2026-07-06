import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Header } from '@/components/layout/Header'
import { Sidebar } from '@/components/layout/Sidebar'
import { BottomNav } from '@/components/layout/BottomNav'
import { getAllInstruments } from '@/lib/data'
import { AppProviders } from '@/components/providers/AppProviders'
import { InstrumentsProvider } from '@/components/providers/InstrumentsProvider'
import { SiteFooter } from '@/components/layout/SiteFooter'
import { ScrapeStatusBanner } from '@/components/data/ScrapeStatusBanner'
import { LocaleProvider } from '@/components/providers/LocaleProvider'
import { LocaleEffects } from '@/components/providers/LocaleEffects'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getDictionary, translate } from '@/lib/i18n/get-dictionary'

export function generateStaticParams() {
    return [{ locale: 'mk' }, { locale: 'en' }]
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale: raw } = await params
    const locale = isLocale(raw) ? raw : 'mk'
    const messages = getDictionary(locale)

    return {
        title: translate(messages, 'meta.siteTitle'),
        description: translate(messages, 'meta.siteDescription'),
        manifest: '/manifest.json',
        icons: {
            icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
            apple: [{ url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
        },
        openGraph: {
            title: translate(messages, 'meta.siteTitle'),
            description: translate(messages, 'meta.siteDescription'),
            images: [
                {
                    url: '/og.png',
                    width: 1200,
                    height: 630,
                    alt: translate(messages, 'meta.ogAlt'),
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: translate(messages, 'meta.siteTitle'),
            description: translate(messages, 'meta.siteDescription'),
            images: ['/og.png'],
        },
        alternates: {
            languages: {
                mk: '/',
                en: '/en',
            },
        },
    }
}

export default async function LocaleLayout({
    children,
    params,
}: {
    children: React.ReactNode
    params: Promise<{ locale: string }>
}) {
    const { locale: raw } = await params
    if (!isLocale(raw)) notFound()

    const locale = raw as Locale
    const instruments = await getAllInstruments()

    return (
        <LocaleProvider locale={locale}>
            <AppProviders>
                <LocaleEffects />
                <InstrumentsProvider instruments={instruments}>
                    <Header instruments={instruments} />

                    <div className="flex flex-1 overflow-hidden">
                        <Sidebar />

                        <main className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth">
                            <div className="max-w-[1600px] mx-auto p-4 md:p-6 pb-28 md:pb-6 space-y-4">
                                <ScrapeStatusBanner />
                                {children}
                                <SiteFooter />
                            </div>
                        </main>
                    </div>

                    <BottomNav />
                </InstrumentsProvider>
            </AppProviders>
        </LocaleProvider>
    )
}
