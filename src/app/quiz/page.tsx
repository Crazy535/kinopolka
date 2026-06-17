import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { QuizContainer } from '@/components/quiz/quiz-container'
import type { ContentType } from '@/types/quiz'

interface QuizPageProps {
  searchParams: Promise<{ start?: string }>
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const [{ start }, session] = await Promise.all([searchParams, auth()])
  const initialType: ContentType | undefined =
    start === 'movie' ? 'movie' : start === 'tv' ? 'tv' : undefined

  let userGenreIds: number[] = []
  if (session?.user?.id) {
    const profile = await prisma.tasteProfile.findUnique({
      where: { userId: session.user.id },
      select: { genreIds: true },
    })
    userGenreIds = profile?.genreIds ?? []
  }

  return (
    <div className="mx-auto max-w-2xl">
      <QuizContainer
        initialType={initialType}
        isAuthenticated={!!session}
        userGenreIds={userGenreIds}
      />
    </div>
  )
}
