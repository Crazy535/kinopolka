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
    <div className="pb-8">
      <div className="mb-6">
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Свайп
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Листай — нашёл — смотри
        </p>
      </div>
      <SwipeDeck isAuthenticated={!!userId} userGenreIds={userGenreIds} />
    </div>
  )
}
