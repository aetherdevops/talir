'use client'

import { Eye, Briefcase } from 'lucide-react'
import { useLocale } from '@/components/providers/LocaleProvider'

export const CREATE_ACTION_IDS = ['watchlist', 'portfolio'] as const
export type CreateActionId = (typeof CREATE_ACTION_IDS)[number]

export function useCreateActions() {
    const { t } = useLocale()

    return [
        {
            id: 'watchlist' as const,
            icon: Eye,
            title: t('create.watchlistTitle'),
            description: t('create.watchlistDesc'),
        },
        {
            id: 'portfolio' as const,
            icon: Briefcase,
            title: t('create.portfolioTitle'),
            description: t('create.portfolioDesc'),
        },
    ]
}
