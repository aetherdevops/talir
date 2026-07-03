import { cn } from '@/lib/utils'
import Link from 'next/link'
import { TalirMark } from '@/components/common/TalirMark'

interface LogoProps {
    className?: string
    compact?: boolean
}

export function Logo({ className, compact = false }: LogoProps) {
    return (
        <Link
            href="/"
            className={cn('flex items-center gap-2.5 min-h-[44px] group', className)}
        >
            <TalirMark size={compact ? 32 : 40} className="talir-logo-mark" />
            {!compact && (
                <div className="flex items-center leading-none">
                    <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-text-primary">
                        Talir<span className="text-accent">.</span>
                    </span>
                </div>
            )}
        </Link>
    )
}