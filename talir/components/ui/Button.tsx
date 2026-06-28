import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
    size?: 'sm' | 'md' | 'lg' | 'icon'
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', asChild = false, ...props }, ref) => {
        // Pill shape, font sans, active scale animation
        const baseStyles = 'inline-flex items-center justify-center rounded-full font-medium transition-all duration-200 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 disabled:pointer-events-none disabled:opacity-50 shadow-sm'

        const variants = {
            primary: 'bg-brand-600 text-white hover:bg-brand-700 hover:shadow-md hover:shadow-brand-500/20',
            secondary: 'glass bg-surface text-brand-600 border border-brand-100 dark:border-brand-900/30 dark:bg-brand-900/10 hover:bg-brand-50 dark:hover:bg-brand-900/30',
            ghost: 'bg-transparent text-text-secondary hover:bg-surface-secondary dark:hover:bg-white/5 hover:text-text-primary shadow-none',
            danger: 'bg-loss/10 text-loss hover:bg-loss/20 border border-loss/20',
            outline: 'bg-transparent border border-border text-text-primary hover:bg-surface-secondary',
        }

        const sizes = {
            sm: 'h-8 px-4 text-xs font-semibold tracking-wide',
            md: 'h-10 px-6 text-sm',
            lg: 'h-12 px-8 text-base font-semibold',
            icon: 'h-10 w-10 p-0 rounded-full',
        }

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                {...props}
            />
        )
    }
)
Button.displayName = 'Button'

export { Button }
