import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-2xl bg-orange-100/60", className)} />;
}

export function SearchResultsSkeleton() {
  return (
    <div className="space-y-12">
      <section>
        <Skeleton className="mb-4 h-8 w-40" />
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-3xl border border-orange-100 bg-white">
              <Skeleton className="h-40 rounded-none" />
              <div className="space-y-3 p-5">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="mb-4 h-8 w-36" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-4 rounded-2xl border border-orange-100 bg-white p-4">
              <Skeleton className="h-20 w-24 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-5 w-20" />
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
