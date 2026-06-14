'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Shuffle } from 'lucide-react'
import { MOODS } from '@/types/quiz'
import { useRouletteStore } from '@/stores/roulette-store'
import { RouletteResult } from './roulette-result'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { trackRouletteSpun } from '@/lib/analytics'

const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]

const SLIDE = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.22, ease: EXPO_OUT },
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
          <motion.div key="loading" {...SLIDE} className="w-full max-w-[200px]">
            <div className="flex flex-col items-center gap-5 py-8">
              <div className="flex items-center gap-3">
                <Shuffle className="size-5 animate-spin text-gold" />
                <span className="text-sm font-medium text-muted-foreground">Крутим…</span>
              </div>
              <div className="w-full">
                <MovieCardSkeleton />
              </div>
            </div>
          </motion.div>
        ) : error ? (
          <motion.div key="error" {...SLIDE} className="py-16 text-center">
            <p className="mb-4 text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={handleSpin}
              className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              Попробовать снова
            </button>
          </motion.div>
        ) : (
          <motion.div key="mood" {...SLIDE} className="flex w-full max-w-md flex-col gap-7">
            <div>
              <h2 className="mb-5 font-heading text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                Какое настроение?
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {MOODS.map((mood, i) => (
                  <button
                    key={mood.label}
                    type="button"
                    onClick={() => setMood(i)}
                    className={`flex flex-col items-center gap-2 rounded-lg border p-4 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      moodIndex === i
                        ? 'border-gold bg-gold/10 text-gold shadow-[0_0_18px_oklch(0.80_0.13_80_/_0.18)]'
                        : 'border-border bg-card text-foreground hover:border-gold/40 hover:bg-surface-hover'
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
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-gold py-4 text-[15px] font-bold text-gold-foreground transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90 hover:shadow-[0_4px_20px_oklch(0.80_0.13_80_/_0.30)] active:scale-[0.99]"
            >
              <Shuffle className="size-4" />
              Крутить рулетку
            </button>
            {moodIndex === null && (
              <p className="text-center text-xs text-muted-foreground">↑ Выберите настроение выше</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
