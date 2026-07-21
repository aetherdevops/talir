import type { Metadata } from 'next'
import { getMacroDashboard, getSectorRollups } from '@/lib/data'
import { isLocale } from '@/lib/i18n/config'
import { getDictionary, translate } from '@/lib/i18n/get-dictionary'
import { MacroPageClient } from './client'

export async function generateMetadata({
    params,
}: {
    params: Promise<{ locale: string }>
}): Promise<Metadata> {
    const { locale: raw } = await params
    const locale = isLocale(raw) ? raw : 'mk'
    const messages = getDictionary(locale)

    return {
        title: `${translate(messages, 'macro.title')} | ${translate(messages, 'brand.wordmark')}`,
        description: translate(messages, 'macro.subtitle'),
    }
}

export const revalidate = 86400

export default function MacroPage() {
    const data = getMacroDashboard()
    const sectors = getSectorRollups()
    return <MacroPageClient data={data} sectors={sectors} />
}
