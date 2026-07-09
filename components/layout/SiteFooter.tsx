'use client'

import { TalirMark } from '@/components/common/TalirMark'
import { cn } from '@/lib/utils'
import { LocaleLink } from '@/components/layout/LocaleLink'
import { useLocale } from '@/components/providers/LocaleProvider'

export function SiteFooter() {
    const year = new Date().getFullYear()
    const { t } = useLocale()

    const legalLinks = [
        { href: '/about', label: t('footer.about') },
        { href: '/contact', label: t('footer.contact') },
        { href: '/privacy', label: t('footer.privacy') },
        { href: '/terms', label: t('footer.terms') },
    ] as const

    return (
        <footer
            className={cn(
                'mt-8 -mx-4 md:-mx-6 px-4 md:px-6 py-6 md:py-8',
                'border-t border-border bg-surface-secondary/50 text-text-secondary',
                'dark:border-[rgba(231,217,168,0.14)] dark:bg-[var(--talir-navy-deep)] dark:text-[var(--talir-ivory)]'
            )}
            aria-label={t('footer.siteFooterAria')}
        >
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
                <div className="space-y-2 min-w-0">
                    <LocaleLink
                        href="/"
                        className="inline-flex items-center gap-3 no-underline group"
                        aria-label={t('footer.homeAria')}
                    >
                        <span className="dark:hidden">
                            <TalirMark size={36} disc="transparent" ink="var(--talir-navy)" />
                        </span>
                        <span className="hidden dark:inline">
                            <TalirMark size={36} disc="transparent" ink="var(--talir-gold-soft)" />
                        </span>
                        <span className="min-w-0">
                            <span className="block font-heading font-bold text-lg tracking-tight text-text-primary dark:text-[var(--talir-ivory)]">
                                {t('brand.wordmark')}
                                <span className="text-accent">.</span>
                            </span>
                            <span className="block font-data text-[9px] uppercase tracking-[0.32em] text-text-muted dark:text-[#9FB0C9] mt-0.5">
                                {t('brand.tagline')}
                            </span>
                        </span>
                    </LocaleLink>
                </div>

                <div className="space-y-2 text-xs leading-relaxed min-w-0">
                    <p className="font-semibold text-text-primary dark:text-[var(--talir-ivory)] text-sm font-heading">
                        {t('footer.dataSources')}
                    </p>
                    <p>
                        {t('footer.marketData')}{' '}
                        <a
                            href="https://www.mse.mk"
                            className="text-accent hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t('footer.mseLink')}
                        </a>
                        . {t('footer.filings')}{' '}
                        <a
                            href="https://seinet.com.mk"
                            className="text-accent hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            {t('footer.seiNetLink')}
                        </a>
                        .
                    </p>
                    <p className="font-data text-[11px] text-text-tertiary dark:text-[#9FB0C9]">
                        {t('freshness.eodShort')}
                    </p>
                    <p className="text-text-tertiary dark:text-[#9FB0C9]">{t('footer.disclaimer')}</p>
                </div>

                <div className="space-y-3 min-w-0">
                    <nav aria-label={t('footer.legalAria')} className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
                        {legalLinks.map((link) => (
                            <LocaleLink
                                key={link.href}
                                href={link.href}
                                className="text-text-secondary hover:text-accent dark:text-[#9FB0C9] dark:hover:text-[var(--talir-gold-bright)] transition-colors min-h-[44px] inline-flex items-center"
                            >
                                {link.label}
                            </LocaleLink>
                        ))}
                    </nav>
                    <p className="text-[11px] font-data text-text-tertiary dark:text-[#9FB0C9]">
                        {t('footer.copyright', { year })}
                    </p>
                </div>
            </div>
        </footer>
    )
}
