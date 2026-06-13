'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Check } from 'lucide-react'
import { saveTasteProfile } from '@/actions/onboarding'
import { getPosterUrl } from '@/lib/tmdb-image'
import type { TMDBMovie } from '@/types/tmdb'

interface Props {
  posters: TMDBMovie[]
}

const MIN_SELECT = 10
const MAX_SELECT = 20

export function OnboardingContainer({ posters }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [isPending, startTransition] = useTransition()

  function toggle(movie: TMDBMovie) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(movie.id)) {
        next.delete(movie.id)
      } else if (next.size < MAX_SELECT) {
        next.add(movie.id)
      }
      return next
    })
  }

  function handleSubmit() {
    const selectedMovies = posters
      .filter((m) => selected.has(m.id))
      .map((m) => ({ id: m.id, genre_ids: m.genre_ids }))

    startTransition(() => {
      saveTasteProfile(selectedMovies)
    })
  }

  const count = selected.size
  const canSubmit = count >= MIN_SELECT && count <= MAX_SELECT

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold">Что тебе нравится?</h1>
            <p className="text-sm text-muted-foreground">
              Выбери от {MIN_SELECT} до {MAX_SELECT} фильмов — настроим ленту под тебя
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <span className={`text-sm font-medium tabular-nums ${canSubmit ? 'text-primary' : 'text-muted-foreground'}`}>
              {count}/{MAX_SELECT}
            </span>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isPending}
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity"
            >
              {isPending ? 'Сохраняем...' : 'Готово'}
            </button>
          </div>
        </div>
        {/* Progress bar */}
        <div className="max-w-6xl mx-auto mt-3">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              animate={{ width: `${(count / MAX_SELECT) * 100}%` }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          </div>
        </div>
      </div>

      {/* Poster grid */}
      <div className="max-w-6xl mx-auto px-4 pt-6">
        <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
          {posters.map((movie) => {
            const isSelected = selected.has(movie.id)
            const isDisabled = !isSelected && count >= MAX_SELECT
            return (
              <button
                key={movie.id}
                onClick={() => toggle(movie)}
                disabled={isDisabled}
                className={`relative aspect-[2/3] rounded-lg overflow-hidden transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary ${
                  isDisabled ? 'opacity-40 cursor-not-allowed' : 'hover:scale-105 active:scale-100'
                }`}
              >
                <Image
                  src={getPosterUrl(movie.poster_path, 'w185') ?? '/placeholder.png'}
                  alt={movie.title}
                  fill
                  sizes="(max-width: 640px) 25vw, (max-width: 768px) 20vw, (max-width: 1024px) 16vw, 12vw"
                  className="object-cover"
                />
                {/* Selection overlay */}
                <AnimatePresence>
                  {isSelected && (
                    <motion.div
                      key="overlay"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15 }}
                      className="absolute inset-0 bg-primary/60 flex items-center justify-center"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                      >
                        <Check className="w-8 h-8 text-white stroke-[3]" />
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {/* Ring when selected */}
                {isSelected && (
                  <div className="absolute inset-0 ring-2 ring-primary rounded-lg pointer-events-none" />
                )}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
