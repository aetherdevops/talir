import Link from 'next/link'
import type { DividendCalendarEntry } from '@/lib/dividends'
import { DividendRow } from '@/components/dividends/DividendRow'
import { cn } from '@/lib/utils'

interface HomeDividendsPanelProps {
    recent: DividendCalendarEntry[]
    upcoming: DividendCalendarEntry[]
    variant?: 'aside' | 'mobile'
    className?: string
}

export function HomeDividendsPanel({
    recent,
    upcoming,
    variant = 'aside',
    className,
}: HomeDividendsPanelProps) {
    const recentItems = recent.slice(0, 5)
    const upcomingItems = upcoming.slice(0, 5)
    const isAside = variant === 'aside'

    return (
        <section
            className={cn(
                'space-y-3 min-w-0',
                isAside && 'sticky top-4',
                className
            )}
            aria-labelledby="home-dividends-heading"
        >
            <header className="space-y-1 min-w-0">
                <div className="flex items-center justify-between gap-2 min-w-0">
                    <h2
                        id="home-dividends-heading"
                        className={cn(
                            'font-heading font-semibold text-text-primary tracking-tight',
                            isAside ? 'text-lg' : 'text-base font-bold'
                        )}
                    >
                        Dividends
                    </h2>
                    <Link href="/dividends" className="text-xs font-medium text-accent hover:underline shrink-0">
                        View all
                    </Link>
                </div>
                <p className="text-xs text-text-tertiary font-data leading-snug">
                    From SECNet dividend calendars · not live · not a forecast
                </p>
            </header>

            <DividendSubBlock title="Recent calendars">
                {recentItems.length ? (
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {recentItems.map((entry) => (
                            <DividendRow key={`${entry.stockCode}-${entry.filedAt}-${entry.url}`} entry={entry} />
                        ))}
                    </div>
                ) : (
                    <p className="text-xs text-text-tertiary px-1">
                        No dividend calendars in the current feed.
                    </p>
                )}
            </DividendSubBlock>

            {upcomingItems.length > 0 && (
                <DividendSubBlock title="Upcoming ex-dates">
                    <p className="text-xs text-text-tertiary font-data mb-1.5">
                        Official ex-dates from filed calendars only
                    </p>
                    <div className="min-w-0 rounded-lg bg-surface-secondary/30 px-1">
                        {upcomingItems.map((entry) => (
                            <DividendRow key={`up-${entry.stockCode}-${entry.exDate}`} entry={entry} />
                        ))}
                    </div>
                </DividendSubBlock>
            )}
        </section>
    )
}

function DividendSubBlock({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="space-y-1 min-w-0">
            <h3 className="text-sm font-semibold font-heading text-text-primary">{title}</h3>
            {children}
        </div>
    )
}
