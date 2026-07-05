'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** Internal horizontal scroll for leaderboard cards below lg — must not widen the document. */
export function MobileLeaderboardScrollRow({
    children,
    className,
}: {
    children: ReactNode
    className?: string
}) {
    return (
        <div className={cn('min-w-0 max-w-full overflow-hidden lg:hidden', className)}>
            <div
                className={cn(
                    'flex gap-2 overflow-x-auto overscroll-x-contain',
                    'snap-x snap-mandatory touch-pan-x scrollbar-hide',
                    'pb-0.5'
                )}
            >
                {children}
            </div>
        </div>
    )
}

/** Fixed leaderboard card width — calc leaves ~20px peek of the next card on mobile. */
export const LEADERBOARD_CARD_CLASS =
    'shrink-0 snap-start h-[118px] w-[calc(100%-1.25rem)] max-w-[180px] lg:w-[180px]'
