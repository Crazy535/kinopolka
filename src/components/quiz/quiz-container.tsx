'use client'

import { useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useQuizStore } from '@/stores/quiz-store'
import { QuizStep } from './quiz-step'
import { QuizResults } from './quiz-results'
import { MOODS, RUNTIMES } from '@/types/quiz'
import type { ContentType, RuntimeOption, RecommendationItem } from '@/types/quiz'
import { trackTTWStart, trackQuizStep } from '@/lib/analytics'

interface QuizContainerProps {
  initialType?: ContentType
  isAuthenticated?: boolean
}

const STEP_VARIANTS = {
  initial: { opacity: 0, x: 40 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -40 },
}

export function QuizContainer({ initialType, isAuthenticated = false }: QuizContainerProps) {
  const userType = isAuthenticated ? 'auth' : 'anon'
  const {
    step, type, moodIndex,
    setType, setMood, setRuntime,
    setResults, setLoading, setError,
    reset, startTTW, stopTTW,
    results, isLoading, error,
  } = useQuizStore()

  useEffect(() => {
    reset()
    if (initialType) setType(initialType)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchRecommendations(
    resolvedType: ContentType,
    resolvedMoodIndex: number,
    resolvedRuntime?: string
  ) {
    setError(null)
    const mood = MOODS[resolvedMoodIndex]
    const genreId = resolvedType === 'movie' ? mood.movieGenreId : mood.tvGenreId

    const params = new URLSearchParams({
      type: resolvedType,
      genre_id: String(genreId),
    })
    if (resolvedRuntime && resolvedRuntime !== 'any') {
      params.set('runtime', resolvedRuntime)
    }

    try {
      const res = await fetch(`/api/recommendations?${params}`)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = (await res.json()) as { items: RecommendationItem[] }
      setResults(data.items)
      stopTTW()
    } catch {
      setError('Не удалось загрузить рекомендации. Попробуй ещё раз.')
    }
  }

  function handleTypeSelect(value: string) {
    startTTW()
    setType(value as ContentType)
    trackTTWStart(userType, '/quiz')
    trackQuizStep(1, userType)
  }

  function handleMoodSelect(value: string) {
    const idx = parseInt(value, 10)
    const resolvedType = type!
    setMood(idx)
    trackQuizStep(2, userType)
    if (resolvedType === 'tv') {
      setLoading(true)
      void fetchRecommendations(resolvedType, idx)
    }
  }

  function handleRuntimeSelect(value: string) {
    setLoading(true)
    setRuntime(value as RuntimeOption)
    trackQuizStep(3, userType)
    void fetchRecommendations(type!, moodIndex!, value)
  }

  const typeOptions = [
    { value: 'movie', label: 'Фильм',   emoji: '🎬' },
    { value: 'tv',    label: 'Сериал',  emoji: '📺' },
  ]

  const moodOptions = MOODS.map((m, i) => ({
    value: String(i),
    label: m.label,
    emoji: m.emoji,
  }))

  const runtimeOptions = RUNTIMES.map((r) => ({
    value: r.value,
    label: r.label,
    sublabel: r.sublabel,
    emoji: r.emoji,
  }))

  const questions = [
    { question: 'Что хочешь посмотреть?', options: typeOptions,    onSelect: handleTypeSelect   },
    { question: 'Какое настроение?',      options: moodOptions,    onSelect: handleMoodSelect   },
    { question: 'Сколько времени есть?',  options: runtimeOptions, onSelect: handleRuntimeSelect },
  ]

  const totalSteps = type === 'tv' ? 2 : 3

  if (step >= 3) {
    return (
      <QuizResults
        results={results}
        isLoading={isLoading}
        error={error}
        onReset={reset}
        userType={userType}
      />
    )
  }

  const current = questions[step]

  return (
    <div>
      <div className="mb-8">
        <div className="mb-2 flex justify-between text-xs text-muted-foreground">
          <span>Шаг {step + 1} из {totalSteps}</span>
        </div>
        <div className="h-1 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-300"
            style={{ width: `${(step / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={STEP_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.18, ease: 'easeOut' }}
        >
          <QuizStep
            question={current.question}
            options={current.options}
            onSelect={current.onSelect}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
