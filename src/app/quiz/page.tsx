import { QuizContainer } from '@/components/quiz/quiz-container'
import type { ContentType } from '@/types/quiz'

interface QuizPageProps {
  searchParams: Promise<{ start?: string }>
}

export default async function QuizPage({ searchParams }: QuizPageProps) {
  const { start } = await searchParams
  const initialType: ContentType | undefined =
    start === 'movie' ? 'movie' : start === 'tv' ? 'tv' : undefined

  return (
    <div className="mx-auto max-w-2xl">
      <QuizContainer initialType={initialType} />
    </div>
  )
}
