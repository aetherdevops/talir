'use client'

import Link from 'next/link'
import type { ComponentProps } from 'react'
import { useLocale } from '@/components/providers/LocaleProvider'
import { localizedPath } from '@/lib/i18n/routing'

type LocaleLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & {
    href: string
}

export function LocaleLink({ href, ...props }: LocaleLinkProps) {
    const { locale } = useLocale()
    return <Link href={localizedPath(href, locale)} {...props} />
}
