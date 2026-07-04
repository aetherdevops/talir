import { cn } from '@/lib/utils'

interface PendingLegalNoticeProps {
    page: string
    children?: React.ReactNode
    className?: string
}

/** Clearly marks stub legal pages — never masquerades as real policy text. */
export function PendingLegalNotice({ page, children, className }: PendingLegalNoticeProps) {
    return (
        <div
            className={cn(
                'rounded-xl border border-dashed border-border bg-surface-secondary/40 px-4 py-4 space-y-3',
                className
            )}
            role="status"
        >
            <p className="text-xs font-data font-semibold uppercase tracking-wider text-accent">
                Pending — not a legal document
            </p>
            <p className="text-sm text-text-secondary leading-relaxed">
                {children ??
                    `The ${page} page is a placeholder only. Final copy will be published after legal review.`}
            </p>
        </div>
    )
}
