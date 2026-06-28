
import { Button } from "@/components/ui/Button"
import { PieChart } from "lucide-react"

export function PortfolioEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="bg-surface-secondary/50 p-6 rounded-full mb-6">
                <PieChart className="w-12 h-12 text-text-tertiary" />
            </div>
            <h3 className="text-xl font-bold text-text-primary mb-2">Build your portfolio</h3>
            <p className="text-text-tertiary mb-8 max-w-sm">
                Track your investments and analyze performance in real-time.
            </p>
            <Button onClick={onAdd} className="flex items-center gap-2">
                Add holding
            </Button>
        </div>
    )
}
