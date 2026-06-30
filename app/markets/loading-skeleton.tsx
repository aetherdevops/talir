import { Skeleton } from "@/components/ui/Skeleton"

export function MarketsLoadingSkeleton() {
    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Skeleton className="h-9 w-56" />
                <Skeleton className="h-4 w-80" />
            </div>
            <Skeleton className="h-20 w-full rounded-xl" />
            <div className="flex flex-wrap gap-2">
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
                <Skeleton className="h-8 w-20 rounded-full" />
            </div>
            <div className="rounded-xl border border-border overflow-hidden divide-y divide-border">
                {[...Array(8)].map((_, i) => (
                    <Skeleton key={i} className="h-[52px] w-full rounded-none" />
                ))}
            </div>
        </div>
    )
}
