import { cn } from '@/lib/utils'

interface TalirMarkProps {
    size?: number
    disc?: string   // coin background
    ink?: string    // reeded edge + acorn
    className?: string
}

/** "The Sovereign" — navy reeded coin, gold acorn. Geometry per .cursor/rules/talir-brand.mdc §3a. Do not redraw. */
export function TalirMark({
    size = 40,
    disc = 'var(--disc, var(--talir-navy))',
    ink = 'var(--ink, var(--talir-gold))',
    className,
}: TalirMarkProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 100 100"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('shrink-0', className)}
            aria-hidden
        >
            {/* coin disc */}
            <circle cx="50" cy="50" r="47" fill={disc} />
            {/* reeded (dashed) edge — the signature */}
            <circle cx="50" cy="50" r="46" fill="none" stroke={ink} strokeWidth="1.7" strokeDasharray="1.1 2.5" strokeLinecap="round" />
            <circle cx="50" cy="50" r="42.5" fill="none" stroke={ink} strokeWidth="0.9" strokeOpacity="0.85" />
            <circle cx="50" cy="50" r="37" fill="none" stroke={ink} strokeWidth="0.7" strokeOpacity="0.5" />
            {/* acorn cap */}
            <path d="M37 45 C37 37 44 32 50 32 C56 32 63 37 63 45 Z" fill={ink} />
            {/* stem */}
            <line x1="50" y1="32" x2="50" y2="27.5" stroke={ink} strokeWidth="2" strokeLinecap="round" />
            {/* acorn body */}
            <path d="M37 47 C37 60 42 70 50 70 C58 70 63 60 63 47 C58 49 42 49 37 47 Z" fill={ink} />
        </svg>
    )
}