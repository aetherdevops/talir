import { cn } from '@/lib/utils'

interface ScrollTableProps {
    children: React.ReactNode
    className?: string
}

/** Horizontal scroll wrapper with edge fade; use sticky first column on cells. */
export function ScrollTable({ children, className }: ScrollTableProps) {
    return (
        <div className={cn('relative -mx-4 sm:mx-0', className)}>
            <div className="overflow-x-auto scroll-fade-right px-4 sm:px-0">
                {children}
            </div>
        </div>
    )
}
