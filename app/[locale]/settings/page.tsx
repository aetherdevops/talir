'use client'

import { LocaleLink } from '@/components/layout/LocaleLink'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { ThemeSetting } from '@/components/settings/ThemeSetting'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { DataPrivacySettings } from '@/components/settings/DataPrivacySettings'
import { AboutSection } from '@/components/settings/AboutSection'
import { DisplaySettings, DefaultSettings } from '@/components/settings/DisplaySettings'
import { useLocale } from '@/components/providers/LocaleProvider'

function SettingsSection({
    title,
    description,
    children,
}: {
    title: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <section className="bg-surface border border-border rounded-xl p-4 sm:p-6 space-y-4">
            <div>
                <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
                {description && <p className="text-sm text-text-secondary mt-1">{description}</p>}
            </div>
            {children}
        </section>
    )
}

export default function SettingsPage() {
    const { t } = useLocale()

    return (
        <div className="max-w-2xl mx-auto py-8 space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-text-primary">{t('settings.title')}</h1>
                <p className="text-text-secondary mt-2">{t('settings.subtitle')}</p>
            </header>

            <SettingsSection title={t('settings.appearance')} description={t('settings.appearanceHint')}>
                <ThemeSetting />
            </SettingsSection>

            <SettingsSection title={t('settings.notifications')}>
                <NotificationSettings />
            </SettingsSection>

            <SettingsSection title={t('settings.display')}>
                <DisplaySettings />
            </SettingsSection>

            <SettingsSection title={t('settings.defaults')}>
                <DefaultSettings />
            </SettingsSection>

            <SettingsSection title={t('settings.language')}>
                <LanguageSwitcher className="border-border bg-surface-secondary/40 text-text-primary" />
            </SettingsSection>

            <SettingsSection title={t('settings.dataPrivacy')}>
                <DataPrivacySettings />
            </SettingsSection>

            <SettingsSection title={t('auth.account')}>
                <LocaleLink href="/account" className="text-sm text-accent hover:underline">
                    {t('settings.accountSecurity')}
                </LocaleLink>
            </SettingsSection>

            <SettingsSection title={t('settings.about')}>
                <AboutSection />
            </SettingsSection>
        </div>
    )
}
