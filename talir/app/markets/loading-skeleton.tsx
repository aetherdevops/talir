import { Skeleton } from "@/components/ui/Skeleton"

export function MarketsLoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="flex gap-4">
                <Skeleton className="h-10 w-full md:w-64" /> {/* Search */}
                <Skeleton className="h-10 w-32" /> {/* Filter */}
            </div>
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
            </div>
        </div>
    )
}
