import { Suspense } from 'react'

export const dynamic = 'force-dynamic'
import { HeroSection } from '@/components/hero-section'
import { MovieGrid } from '@/components/movie-grid'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'

function MovieGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <section>
        <h2 className="mb-4 text-xl font-semibold tracking-tight">В тренде сейчас</h2>
        <Suspense fallback={<MovieGridSkeleton />}>
          <MovieGrid />
        </Suspense>
      </section>
    </>
  )
}
