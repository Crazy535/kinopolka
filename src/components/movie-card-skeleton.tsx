export function MovieCardSkeleton() {
  return (
    <div className="flex flex-col rounded-lg overflow-hidden bg-card border border-border animate-pulse">
      <div className="aspect-[2/3] w-full bg-muted" />

      <div className="flex flex-col gap-1.5 p-3">
        <div className="h-3.5 w-4/5 rounded bg-muted" />
        <div className="h-3 w-2/5 rounded bg-muted" />
        <div className="flex gap-1.5 mt-0.5">
          <div className="size-6 rounded-sm bg-muted" />
          <div className="size-6 rounded-sm bg-muted" />
          <div className="size-6 rounded-sm bg-muted" />
        </div>
      </div>
    </div>
  )
}
