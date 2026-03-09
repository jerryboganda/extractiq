import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StatCardSkeleton() {
  return (
    <Card className="glass border-border/50 overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-7 w-16" />
          </div>
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="mt-3 h-8 w-full" />
        <div className="flex items-center gap-2 mt-2">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <Card className="glass border-border/50 overflow-hidden">
      <div className="p-3 border-b border-border/50 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="p-3 border-b border-border/30 flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </Card>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="glass border-border/50">
      <CardContent className="p-5">
        <Skeleton className="h-4 w-32 mb-4" />
        <Skeleton className="h-[264px] w-full rounded-lg" />
      </CardContent>
    </Card>
  );
}
