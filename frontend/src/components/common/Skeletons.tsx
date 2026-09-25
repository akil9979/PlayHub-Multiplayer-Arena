interface StatsGridSkeletonProps {
  count?: number;
  columns?: string;
}

export function StatsGridSkeleton({
  count = 5,
  columns = "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5",
}: StatsGridSkeletonProps) {
  return (
    <div className={`grid gap-3.5 sm:gap-4 ${columns} animate-pulse`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="surface-card p-4 sm:p-5 flex flex-col justify-between"
        >
          <div className="h-3 w-16 rounded bg-slate-800" />
          <div className="mt-3 h-8 w-20 rounded bg-slate-800/80" />
          <div className="mt-2 h-2.5 w-14 rounded bg-slate-800/50" />
        </div>
      ))}
    </div>
  );
}

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export function TableSkeleton({ rows = 5, columns = 6 }: TableSkeletonProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-900/40 p-4 animate-pulse">
      <div className="flex gap-4 border-b border-slate-800/80 pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <div key={i} className="h-3.5 flex-1 rounded bg-slate-800" />
        ))}
      </div>
      <div className="divide-y divide-slate-800/50 pt-1">
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="flex items-center gap-4 py-3.5">
            {Array.from({ length: columns }).map((_, c) => (
              <div
                key={c}
                className={`h-4 rounded bg-slate-800/60 ${
                  c === 0 ? "w-8" : c === 1 ? "w-28" : "flex-1"
                }`}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

interface CardsSkeletonProps {
  count?: number;
  columns?: string;
}

export function CardsSkeleton({
  count = 4,
  columns = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
}: CardsSkeletonProps) {
  return (
    <div className={`grid gap-3 ${columns} animate-pulse`}>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/60 p-3.5"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-slate-800" />
            <div className="space-y-1.5">
              <div className="h-3 w-20 rounded bg-slate-800" />
              <div className="h-2.5 w-12 rounded bg-slate-800/60" />
            </div>
          </div>
          <div className="h-7 w-20 rounded-xl bg-slate-800" />
        </div>
      ))}
    </div>
  );
}
