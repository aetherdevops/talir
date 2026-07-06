'use client'

import { usePathname } from 'next/navigation'
import { parsePathname } from '@/lib/i18n/routing'

/** Path without locale prefix — for active nav matching. */
export function useBarePathname(): string {
    const pathname = usePathname()
    return parsePathname(pathname).pathname
}
