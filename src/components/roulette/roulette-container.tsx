'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { MOODS } from '@/types/quiz'
import { useRouletteStore } from '@/stores/roulette-store'
import { RouletteResult } from './roulette-result'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { trackRouletteSpun } from '@/lib/analytics'

const SLIDE = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -16 },
  transition: { duration: 0.2 },
}

interface RouletteContainerProps {
  isAuthenticated?: boolean
}

export function RouletteContainer({ isAuthenticated = false }: RouletteContainerProps) {
  const { moodIndex, result, isLoading, error, setMood, spin, reset } = useRouletteStore()
  const ttwDuration = useRouletteStore((s) => s.ttwDuration)
  const userType = isAuthenticated ? 'auth' : 'anon'

  const selectedMood = moodIndex !== null ? MOODS[moodIndex] : null

  function handleSpin() {
    if (moodIndex === null) return
    const mood = MOODS[moodIndex]
    spin(mood.movieGenreId)
    trackRouletteSpun(userType)
  }

  function handleRespin() {
    if (moodIndex === null) return
    const mood = MOODS[moodIndex]
    spin(mood.movieGenreId)
    trackRouletteSpun(userType)
  }

  function handleChangeMood() {
    reset()
  }

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="result" {...SLIDE}>
            <RouletteResult
              result={result}
              ttwDuration={ttwDuration}
              onRespin={handleRespin}
              onChangeMood={handleChangeMood}
            />
          </motion.div>
        ) : isLoading ? (
          <motion.div key="loading" {...SLIDE} className="w-full max-w-sm sm:max-w-md">
            <div className="flex flex-col items-center gap-4 py-8">
              <div className="flex items-center gap-3">
                <Shuffle className="size-5 animate-spin text-roulette" />
                <span className="font-medium">Крутим рулетку...</span>
              </div>
              <div className="w-full">
                <MovieCardSkeleton />
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div key="error" {...SLIDE} className="py-12 text-center">
            <p className="mb-4 text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={handleSpin}
              className="text-sm font-medium underline underline-offset-4 hover:text-primary"
            >
              Попробовать снова
            </button>
          </motion.div>
        ) : (
          <motion.div key="mood" {...SLIDE} className="flex w-full max-w-lg flex-col gap-6">
            <div>
              <p className="mb-4 text-center text-base font-semibold sm:text-lg">
                Какое настроение?
              </p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MOODS.map((mood, i) => (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setMood(i)}
                    className={`flex flex-col items-center gap-1.5 rounded-xl border px-3 py-4 text-center transition-all hover:border-roulette focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      moodIndex === i
                        ? 'border-roulette bg-roulette/10 text-roulette'
                        : 'border-border bg-card hover:bg-surface-hover'
                    }`}
                  >
                    <span className="text-2xl">{mood.emoji}</span>
                    <span className="text-xs font-medium">{mood.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={handleSpin}
              disabled={moodIndex === null}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-roulette py-4 text-sm font-semibold text-roulette-foreground transition-opacity disabled:opacity-40 hover:opacity-90"
            >
              <Shuffle className="size-4" />
              {selectedMood
                ? `Найти ${selectedMood.label.toLowerCase()} фильм`
                : 'Выберите настроение'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
