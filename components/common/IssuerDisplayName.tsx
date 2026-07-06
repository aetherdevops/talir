'use client'

import { getIssuerDisplayName } from '@/lib/issuer-display-name'
import { useLocale } from '@/components/providers/LocaleProvider'
import { cn } from '@/lib/utils'

interface IssuerDisplayNameProps {
    code: string
    name: string
    className?: string
    title?: string
}

export function IssuerDisplayName({ code, name, className, title }: IssuerDisplayNameProps) {
    const { locale } = useLocale()
    const display = getIssuerDisplayName(locale, code, name)

    return (
        <span className={cn(className)} title={title ?? display}>
            {display}
        </span>
    )
}
