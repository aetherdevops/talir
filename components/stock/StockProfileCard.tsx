'use client'

import { Globe, Phone, ExternalLink } from 'lucide-react'
import type { IssuerData } from '@/lib/types'
import { formatNewsDate } from '@/lib/utils'

interface StockProfileCardProps {
    companyName: string
    sector?: string
    issuerData?: IssuerData
    asOfDate: string
}

export function StockProfileCard({ companyName, sector, issuerData, asOfDate }: StockProfileCardProps) {
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
            <h2 id="stock-profile-heading" className="text-sm font-semibold text-text-primary">
                About {companyName}
            </h2>

            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm">
                {sector ? (
                    <div>
                        <dt className="text-xs text-text-secondary mb-0.5">Sector</dt>
                        <dd className="text-text-primary">{sector}</dd>
                    </div>
                ) : null}
                {address ? (
                    <div>
                        <dt className="text-xs text-text-secondary mb-0.5">Headquarters</dt>
                        <dd className="text-text-primary">
                            {address}
                            {city ? `, ${city}` : ''}
                        </dd>
                    </div>
                ) : null}
                {phone ? (
                    <div>
                        <dt className="text-xs text-text-secondary mb-0.5">Phone</dt>
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
                        <dt className="text-xs text-text-secondary mb-0.5">Website</dt>
                        <dd>
                            <a
                                href={`${websiteHref}?ref=talir`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-accent hover:underline transition-colors"
                            >
                                <Globe className="h-3.5 w-3.5" aria-hidden />
                                {website}
                                <ExternalLink className="h-3 w-3" aria-hidden />
                            </a>
                        </dd>
                    </div>
                ) : null}
            </dl>

            <p className="text-[10px] font-data text-text-secondary leading-snug">
                Listed on MSE · Data as of {formatNewsDate(asOfDate)} · end-of-day close, not live
            </p>
        </section>
    )
}
