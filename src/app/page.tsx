import { Suspense } from 'react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
import { HeroSection } from '@/components/hero-section'
import { MovieGrid } from '@/components/movie-grid'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { PersonalFeed } from '@/components/personal-feed'
import { OnboardingBanner } from '@/components/onboarding-banner'
import { CategoriesSection } from '@/components/home/categories-section'
import { AiRecommender } from '@/components/ai-recommender'

function GridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}

function RowSkeleton() {
  return (
    <div className="space-y-10">
      {Array.from({ length: 3 }).map((_, i) => (
        <section key={i}>
          <div className="mb-4 h-6 w-40 animate-pulse rounded bg-muted" />
          <div className="flex gap-3 overflow-hidden">
            {Array.from({ length: 6 }).map((_, j) => (
              <div key={j} className="w-36 shrink-0 sm:w-40">
                <MovieCardSkeleton />
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

export default async function HomePage() {
  const session = await auth()
  const userId = session?.user?.id

  let userGenreIds: number[] = []
  if (userId) {
    const profile = await prisma.tasteProfile.findUnique({
      where: { userId },
      select: { genreIds: true },
    })
    userGenreIds = profile?.genreIds ?? []
  }

  const hasTasteProfile = userGenreIds.length > 0

  return (
    <>
      <HeroSection />

      {userId && !hasTasteProfile && <OnboardingBanner />}

      {userId && hasTasteProfile && (
        <Suspense fallback={<GridSkeleton />}>
          <PersonalFeed userId={userId} />
        </Suspense>
      )}

      {userId && <AiRecommender />}

      <section className="mb-10">
        <h2 className="mb-5 text-lg font-bold tracking-tight">В тренде сейчас</h2>
        <Suspense fallback={<GridSkeleton />}>
          <MovieGrid userGenreIds={userGenreIds.length > 0 ? userGenreIds : undefined} />
        </Suspense>
      </section>

      <Suspense fallback={<RowSkeleton />}>
        <CategoriesSection userGenreIds={userGenreIds.length > 0 ? userGenreIds : undefined} />
      </Suspense>
    </>
  )
}
