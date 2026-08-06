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
        title: translate(messages, 'privacyPage.metaTitle'),
        description: translate(messages, 'privacyPage.metaDescription'),
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

export default async function PrivacyPage({
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
                    {t('privacyPage.title')}
                </h1>
                <p className="text-sm text-text-secondary leading-relaxed">{t('privacyPage.lead')}</p>
            </header>

            <Section title={t('privacyPage.controllerTitle')} body={t('privacyPage.controllerBody')} />
            <Section title={t('privacyPage.collectTitle')} body={t('privacyPage.collectBody')} />
            <Section title={t('privacyPage.purposesTitle')} body={t('privacyPage.purposesBody')} />
            <Section title={t('privacyPage.processorsTitle')} body={t('privacyPage.processorsBody')} />
            <Section title={t('privacyPage.retentionTitle')} body={t('privacyPage.retentionBody')} />
            <Section title={t('privacyPage.transfersTitle')} body={t('privacyPage.transfersBody')} />
            <Section title={t('privacyPage.rightsTitle')} body={t('privacyPage.rightsBody')} />
            <Section title={t('privacyPage.cookiesTitle')} body={t('privacyPage.cookiesBody')} />
            <Section title={t('privacyPage.contactTitle')} body={t('privacyPage.contactBody')} />

            <p className="text-xs text-text-tertiary leading-relaxed border-t border-border pt-4">
                {t('privacyPage.footnote')}
            </p>

            <p className="text-xs">
                <a href={localizedPath('/', locale)} className="text-accent hover:underline">
                    {t('privacyPage.backHome')}
                </a>
            </p>
        </SectionCard>
    )
}
