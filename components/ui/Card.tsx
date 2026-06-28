import * as React from 'react'
import { cn } from '@/lib/utils'

const Card = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement> & { interactive?: boolean }
>(({ className, interactive, ...props }, ref) => (
    <div
        ref={ref}
        className={cn(
            'rounded-3xl border border-border-light bg-surface text-text-primary shadow-card transition-all duration-300',
            'dark:border-border-dark dark:bg-dark-surface',
            interactive && 'hover:shadow-glass-hover hover:-translate-y-1 cursor-pointer dark:hover:border-brand-500/30',
            className
        )}
        {...props}
    />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div
        ref={ref}
        className={cn('flex flex-col space-y-1.5 p-6 border-b border-border-light/40 dark:border-border-dark/40', className)}
        {...props}
    />
))
CardHeader.displayName = 'CardHeader'

const CardContent = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
    <div ref={ref} className={cn('p-6', className)} {...props} />
))
CardContent.displayName = 'CardContent'

export { Card, CardHeader, CardContent }
