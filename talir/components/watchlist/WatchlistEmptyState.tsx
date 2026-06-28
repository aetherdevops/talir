
import { Button } from "@/components/ui/Button"
import { Search } from "lucide-react"

export function WatchlistEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-surface-secondary/50 p-6 rounded-full mb-6">
                <Search className="w-12 h-12 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Nothing in this watchlist yet</h3>
            <p className="text-text-tertiary mb-8 max-w-sm">
                Add investments to track their performance and keep an eye on your favorite stocks.
            </p>
            <Button onClick={onAdd} className="flex items-center gap-2">
                Add investments
            </Button>
        </div>
    )
}
