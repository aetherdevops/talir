import { cn } from '@/lib/utils'

interface ScrollTableProps {
    children: React.ReactNode
    className?: string
}

/** Horizontal scroll wrapper with edge fade; pair with sticky first column cells. */
export function ScrollTable({ children, className }: ScrollTableProps) {
    return (
        <div className={cn('relative min-w-0', className)}>
            <div className="overflow-x-auto scroll-fade-right">
                {children}
            </div>
        </div>
    )
}

export const SCROLL_TABLE_STICKY_CELL =
    'sticky left-0 z-10 bg-surface group-hover:bg-surface-secondary/50 transition-colors'
