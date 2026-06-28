
import { cn } from "@/lib/utils"

interface ResponsiveTextProps {
    children: React.ReactNode
    className?: string
    baseSize?: 'text-xs' | 'text-sm' | 'text-base' | 'text-lg' | 'text-xl' | 'text-2xl' | 'text-3xl' | 'text-4xl' | 'text-5xl'
}

export function ResponsiveText({ children, className, baseSize = 'text-3xl' }: ResponsiveTextProps) {
    const text = typeof children === 'string' ? children : String(children)
    const length = text.length

    let sizeClass = baseSize

    // Logic to scale down
    // Assuming base is 3xl (typical for big numbers)
    if (baseSize === 'text-3xl') {
        if (length > 15) sizeClass = 'text-lg'
        else if (length > 12) sizeClass = 'text-xl'
        else if (length > 9) sizeClass = 'text-2xl'
    }
    // Assuming base is xl or 2xl
    else if (baseSize === 'text-2xl') {
        if (length > 12) sizeClass = 'text-lg'
        else if (length > 9) sizeClass = 'text-xl'
    }
    else if (baseSize === 'text-sm' || baseSize === 'text-base') {
        // for smaller text, maybe we just truncate or use smaller font if VERY long?
        if (length > 20) sizeClass = 'text-xs'
    }

    return (
        <span className={cn("transition-all duration-200", sizeClass, className)}>
            {children}
        </span>
    )
}
