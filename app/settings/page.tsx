'use client'

import Link from 'next/link'
import { ThemeSetting } from '@/components/settings/ThemeSetting'
import { NotificationSettings } from '@/components/settings/NotificationSettings'
import { DataPrivacySettings } from '@/components/settings/DataPrivacySettings'
import { AboutSection } from '@/components/settings/AboutSection'
import { DisplaySettings, DefaultSettings } from '@/components/settings/DisplaySettings'

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
    return (
        <div className="max-w-2xl mx-auto py-8 space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-text-primary">Settings</h1>
                <p className="text-text-secondary mt-2">Customize your Talir experience</p>
            </header>

            <SettingsSection title="Appearance" description="Choose light or dark mode">
                <ThemeSetting />
            </SettingsSection>

            <SettingsSection title="Notifications" description="In-app alert behavior">
                <NotificationSettings />
            </SettingsSection>

            <SettingsSection title="Display" description="Charts and list layout">
                <DisplaySettings />
            </SettingsSection>

            <SettingsSection title="Defaults" description="New portfolio defaults">
                <DefaultSettings />
            </SettingsSection>

            <SettingsSection title="Data & privacy">
                <DataPrivacySettings />
            </SettingsSection>

            <SettingsSection title="Account">
                <Link href="/account" className="text-sm text-accent hover:underline">
                    Account & security →
                </Link>
            </SettingsSection>

            <SettingsSection title="About">
                <AboutSection />
            </SettingsSection>
        </div>
    )
}
