import { cn } from '@/lib/utils'

interface TalirMarkProps {
    size?: number
    className?: string
}

/** Inline SVG coin mark — uses --disc (gold) and --ink (navy) from theme tokens */
export function TalirMark({ size = 40, className }: TalirMarkProps) {
    const reeds = Array.from({ length: 36 }, (_, i) => {
        const angle = (i / 36) * 360
        const rad = (angle * Math.PI) / 180
        const x1 = 20 + Math.cos(rad) * 15.5
        const y1 = 20 + Math.sin(rad) * 15.5
        const x2 = 20 + Math.cos(rad) * 19.2
        const y2 = 20 + Math.sin(rad) * 19.2
        return (
            <line
                key={i}
                x1={x1}
                y1={y1}
                x2={x2}
                y2={y2}
                stroke="var(--ink, var(--talir-navy))"
                strokeWidth="0.45"
                strokeLinecap="round"
                opacity="0.35"
            />
        )
    })

    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 40 40"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={cn('shrink-0', className)}
            aria-hidden
        >
            <circle cx="20" cy="20" r="19.5" fill="var(--disc, var(--talir-gold))" />
            {reeds}
            <circle cx="20" cy="20" r="14.5" fill="var(--ink, var(--talir-navy))" />
            <path
                d="M14.5 27.5V12.5h6.2c3.4 0 5.6 1.8 5.6 4.6 0 2.1-1.2 3.5-3.1 4.1l4.2 6.3h-3.4l-3.6-5.5h-2.5v5.5H14.5zm2.8-8h3.1c1.6 0 2.6-0.7 2.6-2 0-1.3-1-2-2.6-2h-3.1v4z"
                fill="var(--disc, var(--talir-gold))"
            />
        </svg>
    )
}
