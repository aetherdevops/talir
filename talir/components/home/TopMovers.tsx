import { StockSummary } from "@/lib/types"
import { StockRow } from "@/components/stock/StockRow"
import { Card, CardContent, CardHeader } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { ArrowRight } from "lucide-react"
import Link from "next/link"

interface TopMoversProps {
    title: string
    stocks: StockSummary[]
    viewAllLink?: string
}

export function TopMovers({ title, stocks, viewAllLink = '/market' }: TopMoversProps) {
    return (
        <Card className="rounded-3xl shadow-card border border-border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
                <h2 className="text-xl font-normal text-text-primary">{title}</h2>
                <Button variant="ghost" size="sm" asChild>
                    <Link href={viewAllLink} className="text-brand-text font-bold flex items-center gap-1">
                        View all <ArrowRight className="h-4 w-4" />
                    </Link>
                </Button>
            </CardHeader>
            <div className="bg-surface">
                {stocks.map((stock) => (
                    <StockRow key={stock.code} stock={stock} />
                ))}
            </div>
        </Card>
    )
}
