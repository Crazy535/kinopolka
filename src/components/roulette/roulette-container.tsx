'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Shuffle, Film, Tv } from 'lucide-react'
import { MOODS } from '@/types/quiz'
import { useRouletteStore } from '@/stores/roulette-store'
import { RouletteResult } from './roulette-result'
import { MovieCardSkeleton } from '@/components/movie-card-skeleton'
import { trackRouletteSpun, trackTTWStart } from '@/lib/analytics'

const SPIN_LABELS = [
  'Боевик', 'Комедия', 'Драма', 'Триллер', 'Фантастика',
  'Ужасы', 'Романтика', 'Аниме', 'Документалка', 'Криминал',
  'Анимация', 'Приключения', 'Мистика', 'Биография', 'Фэнтези',
]

function SpinningLoader() {
  const [idx, setIdx] = useState(0)

  useEffect(() => {
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % SPIN_LABELS.length)
    }, 90)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="relative flex size-16 items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border-2 border-transparent border-t-gold border-r-gold/50"
        />
        <Shuffle className="size-7 text-gold" />
      </div>

      <div className="flex flex-col items-center gap-1.5">
        <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Крутим рулетку</p>
        <div className="h-7 overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.p
              key={idx}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              transition={{ duration: 0.09 }}
              className="text-center text-lg font-bold text-foreground"
            >
              {SPIN_LABELS[idx]}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="w-full max-w-[200px]">
        <MovieCardSkeleton />
      </div>
    </div>
  )
}

const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]

const SLIDE = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.22, ease: EXPO_OUT },
}

interface RouletteContainerProps {
  isAuthenticated?: boolean
  userGenreIds?: number[]
}

export function RouletteContainer({ isAuthenticated = false, userGenreIds = [] }: RouletteContainerProps) {
  const { contentType, moodIndex, result, isLoading, error, setContentType, setMood, spin, reset } =
    useRouletteStore()
  const ttwDuration = useRouletteStore((s) => s.ttwDuration)
  const userType = isAuthenticated ? 'auth' : 'anon'

  const selectedMood = moodIndex !== null ? MOODS[moodIndex] : null

  function handleSpin() {
    if (moodIndex === null || contentType === null) return
    const mood = MOODS[moodIndex]
    const genreId = contentType === 'tv' ? mood.tvGenreId : mood.movieGenreId
    trackTTWStart(userType, '/roulette', 'roulette')
    spin(genreId, contentType)
    trackRouletteSpun(userType)
  }

  function handleRespin() {
    if (moodIndex === null || contentType === null) return
    const mood = MOODS[moodIndex]
    const genreId = contentType === 'tv' ? mood.tvGenreId : mood.movieGenreId
    spin(genreId, contentType)
    trackRouletteSpun(userType)
  }

  function handleChangeMood() {
    reset()
  }

  const typeOptions = [
    { type: 'movie' as const, label: 'Фильм', icon: Film },
    { type: 'tv' as const, label: 'Сериал', icon: Tv },
  ]

  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        {result ? (
          <motion.div key="result" {...SLIDE} className="w-full max-w-md">
            <RouletteResult
              result={result}
              ttwDuration={ttwDuration}
              onRespin={handleRespin}
              onChangeMood={handleChangeMood}
              userGenreIds={userGenreIds}
              userType={userType}
            />
          </motion.div>
        ) : isLoading ? (
          <motion.div key="loading" {...SLIDE} className="w-full max-w-sm">
            <SpinningLoader />
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
            {/* Step 0 — content type */}
            <div>
              <h2 className="mb-5 font-heading text-2xl font-bold tracking-[-0.02em] sm:text-3xl">
                Что крутим?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {typeOptions.map(({ type, label, icon: Icon }) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setContentType(type)}
                    className={`flex flex-col items-center gap-2.5 rounded-lg border p-5 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      contentType === type
                        ? 'border-primary bg-primary/10 text-primary shadow-[0_0_18px_oklch(0.58_0.22_18_/_0.15)]'
                        : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-surface-hover'
                    }`}
                  >
                    <Icon className="size-7" strokeWidth={1.5} />
                    <span className="text-sm font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 1 — mood (visible after content type selected) */}
            <AnimatePresence>
              {contentType !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 12 }}
                  transition={{ duration: 0.2, ease: EXPO_OUT }}
                >
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
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="button"
              onClick={handleSpin}
              disabled={contentType === null || moodIndex === null}
              className="flex w-full items-center justify-center gap-2.5 rounded-lg bg-gold py-4 text-[15px] font-bold text-gold-foreground transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90 hover:shadow-[0_4px_20px_oklch(0.80_0.13_80_/_0.30)] active:scale-[0.99]"
            >
              <Shuffle className="size-4" />
              Крутить рулетку
            </button>
            {contentType === null && (
              <p className="text-center text-xs text-muted-foreground">↑ Выберите тип контента выше</p>
            )}
            {contentType !== null && moodIndex === null && (
              <p className="text-center text-xs text-muted-foreground">↑ Выберите настроение выше</p>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
