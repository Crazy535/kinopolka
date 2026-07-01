import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { SwipeDeck } from '@/components/swipe/swipe-deck'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Свайп — Kinopolka',
  description: 'Листай фильмы и сериалы — понравился? Добавляй в список.',
}

export default async function SwipePage() {
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

  return (
    // Height = 100dvh minus header (4.25rem) minus main's own py-8/pb-24 padding (2rem + 6rem)
    // plus a small safety margin and the iOS home-indicator safe-area inset, so the deck
    // below always clears the fixed bottom nav.
    <div className="flex h-[calc(100dvh-13rem-env(safe-area-inset-bottom))] flex-col pb-8 md:h-auto">
      <div className="mb-6 shrink-0">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Свайп
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Листай — нашёл — смотри
        </p>
      </div>
      <div className="min-h-0 flex-1">
        <SwipeDeck isAuthenticated={!!userId} userGenreIds={userGenreIds} />
      </div>
    </div>
  )
}
