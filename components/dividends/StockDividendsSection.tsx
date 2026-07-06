import type { DividendCalendarEntry } from '@/lib/dividends'
import { StockDividendsUpdatesTeaser } from '@/components/dividends/StockDividendsSidebarCard'

interface StockDividendsSectionProps {
    dividends: DividendCalendarEntry[]
    onViewDividends?: () => void
}

export function StockDividendsSection({ dividends, onViewDividends }: StockDividendsSectionProps) {
    if (!dividends.length || !onViewDividends) return null

    return <StockDividendsUpdatesTeaser dividends={dividends} onViewDividends={onViewDividends} />
}
