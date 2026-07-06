import { Skeleton } from "@/components/ui/Skeleton"

export function MarketsLoadingSkeleton() {
    return (
        <div className="space-y-3">
            <div className="space-y-1">
                <Skeleton className="h-8 w-56" />
                <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-16 w-full rounded-xl" />
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-11 w-24 rounded-full" />
                <Skeleton className="h-11 w-24 rounded-full" />
                <Skeleton className="h-11 w-20 rounded-full" />
            </div>
            <div className="border-t border-border divide-y divide-border">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-11 w-full rounded-none" />
                ))}
            </div>
        </div>
    )
}
