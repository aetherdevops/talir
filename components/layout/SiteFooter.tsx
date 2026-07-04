import Link from 'next/link'
import { TalirMark } from '@/components/common/TalirMark'
import { cn } from '@/lib/utils'

const LEGAL_LINKS = [
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy' },
    { href: '/terms', label: 'Terms' },
] as const

export function SiteFooter() {
    const year = new Date().getFullYear()

    return (
        <footer
            className={cn(
                'mt-8 -mx-4 md:-mx-6 px-4 md:px-6 py-6 md:py-8',
                /* Light: hairline panel on ivory — avoids heavy navy slab on --bg */
                'border-t border-border bg-surface-secondary/50 text-text-secondary',
                /* Dark: full navy credibility strip */
                'dark:border-[rgba(231,217,168,0.14)] dark:bg-[var(--talir-navy-deep)] dark:text-[var(--talir-ivory)]'
            )}
            aria-label="Site footer"
        >
            <div className="grid gap-6 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
                <div className="space-y-2 min-w-0">
                    <Link href="/" className="inline-flex items-center gap-3 no-underline group" aria-label="Talir — home">
                        <span className="dark:hidden">
                            <TalirMark size={36} disc="transparent" ink="var(--talir-navy)" />
                        </span>
                        <span className="hidden dark:inline">
                            <TalirMark size={36} disc="transparent" ink="var(--talir-gold-soft)" />
                        </span>
                        <span className="min-w-0">
                            <span className="block font-heading font-bold text-lg tracking-tight text-text-primary dark:text-[var(--talir-ivory)]">
                                Talir<span className="text-accent">.</span>
                            </span>
                            <span className="block font-data text-[9px] uppercase tracking-[0.32em] text-text-muted dark:text-[#9FB0C9] mt-0.5">
                                Makedonska Berza · Markets
                            </span>
                        </span>
                    </Link>
                </div>

                <div className="space-y-2 text-xs leading-relaxed min-w-0">
                    <p className="font-semibold text-text-primary dark:text-[var(--talir-ivory)] text-sm font-heading">
                        Data sources
                    </p>
                    <p>
                        Market data:{' '}
                        <a
                            href="https://www.mse.mk"
                            className="text-accent hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            MSE
                        </a>
                        . Filings:{' '}
                        <a
                            href="https://seinet.com.mk"
                            className="text-accent hover:underline"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            SEInet
                        </a>
                        .
                    </p>
                    <p className="font-data text-[11px] text-text-tertiary dark:text-[#9FB0C9]">
                        End-of-day close · not live
                    </p>
                    <p className="text-text-tertiary dark:text-[#9FB0C9]">
                        Informational purposes only · not investment advice
                    </p>
                </div>

                <div className="space-y-3 min-w-0">
                    <nav aria-label="Legal" className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium">
                        {LEGAL_LINKS.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-text-secondary hover:text-accent dark:text-[#9FB0C9] dark:hover:text-[var(--talir-gold-bright)] transition-colors min-h-[44px] inline-flex items-center"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>
                    <p className="text-[11px] font-data text-text-tertiary dark:text-[#9FB0C9]">
                        © {year} Talir
                    </p>
                </div>
            </div>
        </footer>
    )
}
