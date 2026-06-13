import { MovieCardSkeleton } from '@/components/movie-card-skeleton'

function HeroSkeleton() {
  return (
    <div className="py-10 sm:py-14 animate-pulse">
      <div className="mb-10 flex flex-col items-center gap-3">
        <div className="h-10 w-72 rounded-lg bg-muted sm:h-12 sm:w-96" />
        <div className="h-5 w-56 rounded-lg bg-muted" />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}

export default function Loading() {
  return (
    <>
      <HeroSkeleton />
      <section>
        <div className="mb-4 h-6 w-40 rounded bg-muted animate-pulse" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <MovieCardSkeleton key={i} />
          ))}
        </div>
      </section>
    </>
  )
}
