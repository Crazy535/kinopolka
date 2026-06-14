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
  initial: { opacity: 0, x: 32 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -32 },
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
    <div className="flex min-h-[calc(100vh-5rem)] flex-col justify-center">
      {/* Segmented progress bar */}
      <div className="mb-10 flex flex-col gap-1">
        <p className="text-xs text-muted-foreground">
          Шаг {step + 1} из {totalSteps}
        </p>
        <div className="flex gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-0.5 flex-1 rounded-full transition-all duration-500 ${
                i <= step ? 'bg-primary' : 'bg-border'
              }`}
            />
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          variants={STEP_VARIANTS}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.20, ease: [0.19, 1, 0.22, 1] }}
        >
          <QuizStep
            question={current.question}
            options={current.options}
            onSelect={current.onSelect}
            columns={step === 0 ? 1 : 2}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
