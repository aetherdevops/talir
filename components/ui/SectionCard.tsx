import type { ReactNode } from 'react'
import { AccentTopRule } from '@/components/ui/AccentTopRule'
import { cn } from '@/lib/utils'

type SectionCardProps = {
    children: ReactNode
    className?: string
    header?: ReactNode
    as?: 'section' | 'article' | 'div'
    'aria-labelledby'?: string
}

export function SectionCard({
    children,
    className,
    header,
    as: Tag = 'section',
    'aria-labelledby': ariaLabelledBy,
}: SectionCardProps) {
    return (
        <Tag
            className={cn(
                'relative min-w-0 overflow-hidden rounded-xl border border-border',
                'bg-gradient-to-br from-[var(--surface-2)] via-[var(--surface)] to-[var(--surface)]',
                className
            )}
            aria-labelledby={ariaLabelledBy}
        >
            <AccentTopRule />
            {header ? (
                <div className="relative px-4 pt-4 pb-3 space-y-1 border-b border-border/80">{header}</div>
            ) : null}
            {children}
        </Tag>
    )
}
