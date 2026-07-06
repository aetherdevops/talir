'use client'

import { Globe, Phone, ExternalLink } from 'lucide-react'
import type { IssuerData } from '@/lib/types'
import { getIssuerDisplayName } from '@/lib/issuer-display-name'
import { useLocale } from '@/components/providers/LocaleProvider'
import { translateSector } from '@/lib/sectors'
import { formatNewsDate } from '@/lib/utils'

interface StockProfileCardProps {
    companyCode: string
    companyName: string
    sector?: string
    issuerData?: IssuerData
    asOfDate: string
}

export function StockProfileCard({
    companyCode,
    companyName,
    sector,
    issuerData,
    asOfDate,
}: StockProfileCardProps) {
    const { locale, t } = useLocale()
    const address = issuerData?.address
    const city = issuerData?.city
    const phone = issuerData?.phone
    const website = issuerData?.website

    const hasContent = sector || address || phone || website
    if (!hasContent) return null

    const websiteHref = website
        ? website.startsWith('http')
            ? website
            : `https://${website}`
        : null

    return (
        <section aria-labelledby="stock-profile-heading" className="border border-border rounded-xl bg-surface p-4 md:p-5 space-y-4">
            <h2 id="stock-profile-heading" className="text-sm font-semibold text-text-primary font-heading">
                {t('stock.about', {
                    company: getIssuerDisplayName(locale, companyCode, companyName),
                })}
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {sector ? (
                    <div>
                        <dt className="text-xs text-text-secondary mb-0.5">{t('stock.sector')}</dt>
                        <dd className="text-text-primary">{translateSector(sector, t)}</dd>
                    </div>
                ) : null}
                {address ? (
                    <div>
                        <dt className="text-xs text-text-secondary mb-0.5">{t('stock.headquarters')}</dt>
                        <dd className="text-text-primary">
                            {address}
                            {city ? `, ${city}` : ''}
                        </dd>
                    </div>
                ) : null}
                {phone ? (
                    <div>
                        <dt className="text-xs text-text-secondary mb-0.5">{t('stock.phone')}</dt>
                        <dd>
                            <a
                                href={`tel:${phone}`}
                                className="inline-flex items-center gap-1.5 text-text-primary hover:text-accent transition-colors"
                            >
                                <Phone className="h-3.5 w-3.5 text-text-secondary" aria-hidden />
                                {phone}
                            </a>
                        </dd>
                    </div>
                ) : null}
                {websiteHref ? (
                    <div>
                        <dt className="text-xs text-text-secondary mb-0.5">{t('stock.website')}</dt>
                        <dd>
                            <a
                                href={websiteHref}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 text-text-primary hover:text-accent transition-colors break-all"
                            >
                                <Globe className="h-3.5 w-3.5 text-text-secondary shrink-0" aria-hidden />
                                {website}
                                <ExternalLink className="h-3 w-3 text-text-tertiary shrink-0" aria-hidden />
                            </a>
                        </dd>
                    </div>
                ) : null}
            </dl>

            <p className="text-[11px] font-data text-text-tertiary">
                {formatNewsDate(asOfDate)}
            </p>
        </section>
    )
}
