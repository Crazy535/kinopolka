import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { RouletteContainer } from '@/components/roulette/roulette-container'

export const dynamic = 'force-dynamic'

export default async function RoulettePage() {
  const session = await auth()

  let userGenreIds: number[] = []
  if (session?.user?.id) {
    const profile = await prisma.tasteProfile.findUnique({
      where: { userId: session.user.id },
      select: { genreIds: true },
    })
    userGenreIds = profile?.genreIds ?? []
  }

  return (
    <div>
      <h1 className="sr-only">Кинорулетка</h1>
      <RouletteContainer isAuthenticated={!!session} userGenreIds={userGenreIds} />
    </div>
  )
}
