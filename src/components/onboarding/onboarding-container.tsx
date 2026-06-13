'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Search, X, ChevronRight } from 'lucide-react'
import { completeOnboarding } from '@/actions/onboarding'
import { getPosterUrl, getProfileUrl } from '@/lib/tmdb-image'
import type { TMDBMovie } from '@/types/tmdb'
import type { TMDBPersonResult } from '@/types/tmdb'

interface Props {
  posters: TMDBMovie[]
}

interface SelectedPerson {
  tmdbId: number
  name: string
  role: 'actor' | 'director'
  profilePath: string | null
}

const MIN_SELECT = 10
const MAX_SELECT = 20
const MAX_PEOPLE = 8

export function OnboardingContainer({ posters }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedMovies, setSelectedMovies] = useState<Set<number>>(new Set())
  const [selectedPeople, setSelectedPeople] = useState<Map<number, SelectedPerson>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBPersonResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [isPending, startTransition] = useTransition()
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function toggleMovie(movie: TMDBMovie) {
    setSelectedMovies((prev) => {
      const next = new Set(prev)
      if (next.has(movie.id)) {
        next.delete(movie.id)
      } else if (next.size < MAX_SELECT) {
        next.add(movie.id)
      }
      return next
    })
  }

  function togglePerson(person: TMDBPersonResult) {
    setSelectedPeople((prev) => {
      const next = new Map(prev)
      if (next.has(person.id)) {
        next.delete(person.id)
      } else if (next.size < MAX_PEOPLE) {
        const role: 'actor' | 'director' =
          person.known_for_department === 'Directing' ? 'director' : 'actor'
        next.set(person.id, {
          tmdbId: person.id,
          name: person.name,
          role,
          profilePath: person.profile_path,
        })
      }
      return next
    })
  }

  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    if (query.trim().length < 2) {
      setSearchResults([])
      return
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true)
      try {
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(query)}`)
        const data = await res.json()
        setSearchResults(data.results ?? [])
      } finally {
        setIsSearching(false)
      }
    }, 300)
  }, [])

  function handleFinish() {
    const selectedMoviesData = posters
      .filter((m) => selectedMovies.has(m.id))
      .map((m) => ({ id: m.id, genre_ids: m.genre_ids }))

    startTransition(() => {
      completeOnboarding(selectedMoviesData, [...selectedPeople.values()])
    })
  }

  const movieCount = selectedMovies.size
  const canProceed = movieCount >= MIN_SELECT && movieCount <= MAX_SELECT

  // ─── Step 1: Movie poster grid ───────────────────────────────────────────────
  if (step === 1) {
    return (
      <div className="min-h-screen bg-background pb-32">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-4">
          <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-widest">Шаг 1 из 2</p>
              <h1 className="text-xl font-bold">Что тебе нравится?</h1>
              <p className="text-sm text-muted-foreground">
                Выбери от {MIN_SELECT} до {MAX_SELECT} фильмов
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span className={`text-sm font-medium tabular-nums ${canProceed ? 'text-primary' : 'text-muted-foreground'}`}>
                {movieCount}/{MAX_SELECT}
              </span>
              <button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="flex items-center gap-1.5 px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity"
              >
                Далее <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="max-w-6xl mx-auto mt-3">
            <div className="h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${(movieCount / MAX_SELECT) * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>
          </div>
        </div>

        {/* Poster grid */}
        <div className="max-w-6xl mx-auto px-4 pt-6">
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {posters.map((movie) => {
              const isSelected = selectedMovies.has(movie.id)
              const isDisabled = !isSelected && movieCount >= MAX_SELECT
              return (
                <button
                  key={movie.id}
                  onClick={() => toggleMovie(movie)}
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

  // ─── Step 2: People picker ───────────────────────────────────────────────────
  const selectedPeopleList = [...selectedPeople.values()]

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/90 backdrop-blur border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-widest">Шаг 2 из 2</p>
            <h1 className="text-xl font-bold">Любимые актёры и режиссёры</h1>
            <p className="text-sm text-muted-foreground">
              Необязательно — до {MAX_PEOPLE} человек
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleFinish}
              disabled={isPending}
              className="px-4 py-2 rounded-full border border-border text-sm text-muted-foreground hover:text-foreground transition-colors disabled:opacity-40"
            >
              Пропустить
            </button>
            <button
              onClick={handleFinish}
              disabled={isPending}
              className="px-5 py-2 rounded-full bg-primary text-primary-foreground text-sm font-semibold disabled:opacity-40 transition-opacity"
            >
              {isPending ? 'Сохраняем...' : 'Готово'}
            </button>
          </div>
        </div>
        {/* Step progress */}
        <div className="max-w-2xl mx-auto mt-3">
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-primary rounded-full" style={{ width: '100%' }} />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-6 space-y-6">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Поиск актёров и режиссёров..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => { setSearchQuery(''); setSearchResults([]) }}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Search results */}
        {(searchResults.length > 0 || isSearching) && (
          <div className="space-y-2">
            {isSearching && (
              <p className="text-sm text-muted-foreground text-center py-4">Ищем...</p>
            )}
            {!isSearching && searchResults.map((person) => {
              const isSelected = selectedPeople.has(person.id)
              const isDisabled = !isSelected && selectedPeople.size >= MAX_PEOPLE
              const role = person.known_for_department === 'Directing' ? 'Режиссёр' : 'Актёр'
              return (
                <button
                  key={person.id}
                  onClick={() => togglePerson(person)}
                  disabled={isDisabled}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all text-left ${
                    isSelected
                      ? 'border-primary bg-primary/10'
                      : isDisabled
                      ? 'border-border opacity-40 cursor-not-allowed'
                      : 'border-border hover:border-primary/50 hover:bg-muted/60'
                  }`}
                >
                  <div className="relative w-10 h-10 rounded-full overflow-hidden bg-muted shrink-0">
                    {person.profile_path ? (
                      <Image
                        src={getProfileUrl(person.profile_path, 'w185') ?? ''}
                        alt={person.name}
                        fill
                        sizes="40px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-lg">
                        {person.name[0]}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{person.name}</p>
                    <p className="text-xs text-muted-foreground">{role}</p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-primary shrink-0" />}
                </button>
              )
            })}
          </div>
        )}

        {/* Selected people */}
        {selectedPeopleList.length > 0 && (
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-medium mb-3">
              Выбрано ({selectedPeopleList.length}/{MAX_PEOPLE})
            </p>
            <div className="flex flex-wrap gap-2">
              {selectedPeopleList.map((p) => (
                <motion.button
                  key={p.tmdbId}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setSelectedPeople((prev) => {
                    const next = new Map(prev)
                    next.delete(p.tmdbId)
                    return next
                  })}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-sm"
                >
                  <div className="relative w-5 h-5 rounded-full overflow-hidden bg-muted shrink-0">
                    {p.profilePath ? (
                      <Image
                        src={getProfileUrl(p.profilePath, 'w45') ?? ''}
                        alt={p.name}
                        fill
                        sizes="20px"
                        className="object-cover"
                      />
                    ) : null}
                  </div>
                  <span className="font-medium">{p.name}</span>
                  <X className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state prompt */}
        {searchQuery.trim().length < 2 && selectedPeopleList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Введи имя актёра или режиссёра — мы подберём фильмы с ними в ленте
          </p>
        )}
      </div>
    </div>
  )
}
