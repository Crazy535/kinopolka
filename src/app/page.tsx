import { Suspense } from 'react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
import { HeroSection } from '@/components/hero-section'
import { MovieGrid } from '@/components/movie-grid'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { PersonalFeed } from '@/components/personal-feed'
import { OnboardingBanner } from '@/components/onboarding-banner'

function MovieGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
      {Array.from({ length: 10 }).map((_, i) => (
        <MovieCardSkeleton key={i} />
      ))}
    </div>
  )
}

export default async function HomePage() {
  const session = await auth()
  const userId = session?.user?.id

  let hasTasteProfile = false
  if (userId) {
    const profile = await prisma.tasteProfile.findUnique({
      where: { userId },
      select: { id: true },
    })
    hasTasteProfile = !!profile
  }

  return (
    <>
      <HeroSection />

      {userId && !hasTasteProfile && <OnboardingBanner />}

      {userId && hasTasteProfile && (
        <Suspense fallback={<MovieGridSkeleton />}>
          <PersonalFeed userId={userId} />
        </Suspense>
      )}

      <section>
        <h2 className="mb-5 text-lg font-bold tracking-tight">В тренде сейчас</h2>
        <Suspense fallback={<MovieGridSkeleton />}>
          <MovieGrid />
        </Suspense>
      </section>
    </>
  )
}
