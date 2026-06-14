export function MovieCardSkeleton() {
  return (
    <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-card">
      {/* Shimmer layer */}
      <div className="absolute inset-0 animate-shimmer" />
      {/* Gradient overlay mirroring real card */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      {/* Text placeholder lines */}
      <div className="absolute bottom-0 left-0 right-0 p-3 flex flex-col gap-1.5">
        <div className="h-3 w-4/5 rounded-sm bg-white/8" />
        <div className="h-2.5 w-1/3 rounded-sm bg-white/6" />
      </div>
    </div>
  )
}
