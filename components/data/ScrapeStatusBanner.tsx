import { AlertTriangle } from 'lucide-react'
import { getScrapeMeta } from '@/lib/data'
import { cn } from '@/lib/utils'

export function ScrapeStatusBanner({ className }: { className?: string }) {
    const meta = getScrapeMeta()

    if (meta.status === 'ok') return null

    const isFailed = meta.status === 'failed'
    const message = isFailed
        ? 'Market data could not be refreshed. Showing the last available end-of-day snapshot.'
        : 'Some instruments may be missing from today’s scrape. Figures shown are end-of-day where available.'

    return (
        <div
            role="status"
            className={cn(
                'flex items-start gap-2 rounded-lg border px-3 py-2 text-xs',
                isFailed
                    ? 'border-down/30 bg-down/10 text-down'
                    : 'border-accent/40 bg-accent-muted text-text-secondary',
                className
            )}
        >
            <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
            <div>
                <p className="font-semibold font-heading">
                    {isFailed ? 'Data refresh failed' : 'Partial market data'}
                </p>
                <p className="mt-0.5 opacity-90">{message}</p>
                {meta.asOfDate && (
                    <p className="mt-1 font-data text-[11px] opacity-80">
                        Last successful close · {meta.asOfDate}
                    </p>
                )}
            </div>
        </div>
    )
}
