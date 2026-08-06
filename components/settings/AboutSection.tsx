'use client'

import { useLocale } from '@/components/providers/LocaleProvider'

export function AboutSection() {
    const { t } = useLocale()
    const version = '0.1.0'
    return (
        <div className="space-y-3 text-sm text-text-secondary">
            <p>
                <span className="text-text-tertiary">{t('settings.versionLabel')} </span>
                <span className="text-text-primary font-medium font-data">{version}</span>
            </p>
            <p className="text-xs leading-relaxed">{t('settings.aboutBlurb')}</p>
            <ul className="text-xs space-y-1">
                <li>
                    <a
                        href="https://github.com/aetherdevops/talir"
                        className="text-accent hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        GitHub
                    </a>
                </li>
                <li>
                    <a
                        href="https://www.mse.mk"
                        className="text-accent hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {t('settings.mseLink')}
                    </a>
                </li>
            </ul>
        </div>
    )
}
