import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SectionCard } from '@/components/ui/SectionCard'
import { isLocale, type Locale } from '@/lib/i18n/config'
import { getDictionary, translate } from '@/lib/i18n/get-dictionary'
import { localizedPath } from '@/lib/i18n/routing'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale: raw } = await params
    const locale = isLocale(raw) ? raw : 'mk'
    const messages = getDictionary(locale)
    return {
        title: translate(messages, 'aboutPage.metaTitle'),
        description: translate(messages, 'aboutPage.metaDescription'),
    }
}

function Section({ title, body }: { title: string; body: string }) {
    return (
        <section className="space-y-2">
            <h2 className="font-heading text-lg font-semibold text-text-primary tracking-tight">{title}</h2>
            <p className="text-sm text-text-secondary leading-relaxed">{body}</p>
        </section>
    )
}

export default async function AboutPage({
    params,
}: {
    params: Promise<{ locale: string }>
}) {
    const { locale: raw } = await params
    if (!isLocale(raw)) notFound()
    const locale = raw as Locale
    const messages = getDictionary(locale)
    const t = (key: string) => translate(messages, key)

    return (
        <SectionCard as="article" className="max-w-2xl mx-auto p-6 sm:p-8 space-y-6">
            <header className="space-y-2">
                <h1 className="font-heading text-2xl font-bold text-text-primary tracking-tight">
                    {t('aboutPage.title')}
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed">{t('aboutPage.lead')}</p>
            </header>

            <Section title={t('aboutPage.etymologyTitle')} body={t('aboutPage.etymologyBody')} />
            <Section title={t('aboutPage.markTitle')} body={t('aboutPage.markBody')} />
            <Section title={t('aboutPage.projectTitle')} body={t('aboutPage.projectBody')} />
            <Section title={t('aboutPage.visionTitle')} body={t('aboutPage.visionBody')} />
            <Section title={t('aboutPage.operatorTitle')} body={t('aboutPage.operatorBody')} />
            <Section title={t('aboutPage.founderTitle')} body={t('aboutPage.founderBody')} />

            <p className="text-sm text-text-secondary">
                <span className="text-text-tertiary">{t('aboutPage.versionLabel')} </span>
                <span className="font-data text-text-primary">0.1.0</span>
            </p>

            <p className="text-xs">
                <a href={localizedPath('/', locale)} className="text-accent hover:underline">
                    {t('aboutPage.backHome')}
                </a>
            </p>
        </SectionCard>
    )
}
