import type { FilingIndicatorTier } from '@/lib/types'
import {
    FILING_TIER_DOT_TITLES,
    FILING_TIER_LABELS,
    NEWS_CATEGORY_LABELS,
    resolveFilingTier,
} from '@/lib/news'
import { cn } from '@/lib/utils'

const TIER_DOT_CLASS: Record<FilingIndicatorTier, string> = {
    material: 'bg-[var(--down)]',
    dividend: 'bg-[var(--accent)]',
    routine: 'bg-[var(--neutral)]',
}

interface FilingIndicatorDotProps {
    tier: FilingIndicatorTier
    className?: string
}

export function FilingIndicatorDot({ tier, className }: FilingIndicatorDotProps) {
    return (
        <span
            className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', TIER_DOT_CLASS[tier], className)}
            title={FILING_TIER_DOT_TITLES[tier]}
            aria-hidden
        />
    )
}

interface FilingIndicatorLegendProps {
    className?: string
    compact?: boolean
}

export function FilingIndicatorLegend({ className, compact = false }: FilingIndicatorLegendProps) {
    const tiers: FilingIndicatorTier[] = ['material', 'dividend', 'routine']

    return (
        <div
            className={cn(
                'text-[10px] font-data text-text-tertiary',
                compact ? 'space-y-1' : 'flex flex-wrap gap-x-4 gap-y-1.5',
                className
            )}
            aria-label="Filing type key"
        >
            {!compact && <span className="font-semibold text-text-secondary w-full sm:w-auto">Filing type key</span>}
            {tiers.map((tier) => (
                <span key={tier} className="inline-flex items-center gap-1.5">
                    <FilingIndicatorDot tier={tier} />
                    <span>{FILING_TIER_LABELS[tier]}</span>
                </span>
            ))}
        </div>
    )
}

export function filingTierForItem(item: Parameters<typeof resolveFilingTier>[0]) {
    return resolveFilingTier(item)
}

export { NEWS_CATEGORY_LABELS, TIER_DOT_CLASS }
