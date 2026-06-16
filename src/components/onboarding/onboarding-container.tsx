'use client'

import { useState, useTransition, useCallback, useRef } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Search, X, ChevronRight, Tv } from 'lucide-react'
import { completeOnboarding } from '@/actions/onboarding'
import { getPosterUrl, getProfileUrl } from '@/lib/tmdb-image'
import type { OnboardingItem } from '@/types/tmdb'
import type { TMDBPersonResult } from '@/types/tmdb'

interface Props {
  items: OnboardingItem[]
}

interface SelectedPerson {
  tmdbId: number
  name: string
  role: 'actor' | 'director'
  profilePath: string | null
}

interface SearchResult {
  id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  year: string
  genre_ids: number[]
}

const MIN_SELECT = 10
const MAX_SELECT = 20
const MAX_PEOPLE = 8

export function OnboardingContainer({ items }: Props) {
  const [step, setStep] = useState<1 | 2>(1)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())
  // Store extra items found via search so we have their genre_ids at submit time
  const [extraItems, setExtraItems] = useState<Map<number, OnboardingItem>>(new Map())

  // Step 1 search state
  const [movieSearch, setMovieSearch] = useState('')
  const [movieSearchResults, setMovieSearchResults] = useState<OnboardingItem[]>([])
  const [isMovieSearching, setIsMovieSearching] = useState(false)
  const movieDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Step 2 state
  const [selectedPeople, setSelectedPeople] = useState<Map<number, SelectedPerson>>(new Map())
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<TMDBPersonResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const [isPending, startTransition] = useTransition()

  // ─── Movie selection ─────────────────────────────────────────────────────────

  function toggleItem(item: OnboardingItem) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else if (next.size < MAX_SELECT) {
        next.add(item.id)
      }
      return next
    })
    // Cache item data so we have genre_ids at submit time
    setExtraItems((prev) => {
      if (prev.has(item.id)) return prev
      return new Map(prev).set(item.id, item)
    })
  }

  const handleMovieSearch = useCallback((query: string) => {
    setMovieSearch(query)
    if (movieDebounceRef.current) clearTimeout(movieDebounceRef.current)
    if (query.trim().length < 2) {
      setMovieSearchResults([])
      return
    }
    movieDebounceRef.current = setTimeout(async () => {
      setIsMovieSearching(true)
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=20`)
        const data = await res.json()
        const results: OnboardingItem[] = (data.results ?? []).map((r: SearchResult) => ({
          id: r.id,
          title: r.title,
          poster_path: r.poster_path,
          year: r.year,
          genre_ids: r.genre_ids,
          media_type: r.media_type,
        }))
        setMovieSearchResults(results)
      } finally {
        setIsMovieSearching(false)
      }
    }, 300)
  }, [])

  // ─── People search ───────────────────────────────────────────────────────────

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

  // ─── Submit ──────────────────────────────────────────────────────────────────

  function handleFinish() {
    // Merge default pool items with extra (search) items
    const itemsMap = new Map(items.map((i) => [i.id, i]))
    extraItems.forEach((item, id) => itemsMap.set(id, item))

    const selectedMoviesData = [...selectedIds].map((id) => {
      const item = itemsMap.get(id)
      return { id, genre_ids: item?.genre_ids ?? [] }
    })

    startTransition(() => {
      completeOnboarding(selectedMoviesData, [...selectedPeople.values()])
    })
  }

  const movieCount = selectedIds.size
  const canProceed = movieCount >= MIN_SELECT && movieCount <= MAX_SELECT
  const displayedItems = movieSearch.trim().length >= 2 ? movieSearchResults : items

  // ─── Step 1: Movie & TV selection ────────────────────────────────────────────

  if (step === 1) {
    return (
      <div className="min-h-screen bg-background pb-32">
        {/* Sticky header */}
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-widest">
                  Шаг 1 из 2
                </p>
                <h1 className="text-xl font-bold">Что тебе нравится?</h1>
                <p className="text-sm text-muted-foreground">
                  Выбери от {MIN_SELECT} до {MAX_SELECT} фильмов и сериалов
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0 pt-1">
                <span
                  className={`text-sm font-medium tabular-nums ${
                    canProceed ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {movieCount < MIN_SELECT
                    ? `ещё ${MIN_SELECT - movieCount}`
                    : `${movieCount}/${MAX_SELECT}`}
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

            {/* Progress bar */}
            <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                animate={{ width: `${(movieCount / MAX_SELECT) * 100}%` }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              />
            </div>

            {/* Search input */}
            <div className="mt-3 relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={movieSearch}
                onChange={(e) => handleMovieSearch(e.target.value)}
                placeholder="Поиск фильмов и сериалов..."
                className="w-full h-11 pl-10 pr-10 rounded-xl border border-border bg-muted/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
              />
              {movieSearch && (
                <button
                  onClick={() => {
                    setMovieSearch('')
                    setMovieSearchResults([])
                  }}
                  aria-label="Очистить поиск"
                  className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center -mr-3 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-6xl mx-auto px-4 pt-5">
          {isMovieSearching && (
            <p className="text-sm text-muted-foreground text-center py-8">Ищем...</p>
          )}

          {!isMovieSearching &&
            movieSearch.trim().length >= 2 &&
            movieSearchResults.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-8">
                Ничего не найдено — попробуй другое название
              </p>
            )}

          {!isMovieSearching && (
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-2.5">
              {displayedItems.map((item) => {
                const isSelected = selectedIds.has(item.id)
                const isDisabled = !isSelected && movieCount >= MAX_SELECT
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item)}
                    disabled={isDisabled}
                    title={item.title}
                    className={`group relative aspect-[2/3] rounded-xl overflow-hidden transition-all duration-200 focus-visible:outline-2 focus-visible:outline-primary ${
                      isDisabled
                        ? 'opacity-40 cursor-not-allowed'
                        : 'hover:scale-[1.03] active:scale-100 cursor-pointer'
                    } ${isSelected ? 'ring-2 ring-primary' : ''}`}
                  >
                    {/* Poster */}
                    <Image
                      src={getPosterUrl(item.poster_path, 'w185') ?? '/placeholder.png'}
                      alt={item.title}
                      fill
                      sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 14vw"
                      className="object-cover"
                    />

                    {/* TV badge */}
                    {item.media_type === 'tv' && (
                      <div className="absolute top-1.5 left-1.5 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-sky-500/90 text-white" title="Сериал">
                        <Tv className="w-2.5 h-2.5" />
                        <span className="text-[10px] font-bold leading-none">СЕР</span>
                      </div>
                    )}

                    {/* Selected overlay */}
                    <AnimatePresence>
                      {isSelected && (
                        <motion.div
                          key="overlay"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="absolute inset-0 bg-primary/50"
                        >
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0 }}
                            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                            className="absolute top-2 right-2 bg-white rounded-full p-0.5 shadow"
                          >
                            <Check className="w-3.5 h-3.5 text-primary stroke-[3]" />
                          </motion.div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Title + year overlay at bottom — always visible */}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/95 via-black/60 to-transparent px-2 pb-2 pt-8 pointer-events-none">
                      <p className="text-white text-xs font-semibold leading-tight line-clamp-2">
                        {item.title}
                      </p>
                      {item.year && (
                        <p className="text-white/70 text-xs mt-0.5">{item.year}</p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ─── Step 2: People picker ───────────────────────────────────────────────────

  const selectedPeopleList = [...selectedPeople.values()]

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Sticky header */}
      <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b border-border px-4 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-muted-foreground mb-0.5 font-medium uppercase tracking-widest">
              Шаг 2 из 2
            </p>
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
              onClick={() => {
                setSearchQuery('')
                setSearchResults([])
              }}
              aria-label="Очистить поиск"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center -mr-3 text-muted-foreground hover:text-foreground"
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
            {!isSearching &&
              searchResults.map((person) => {
                const isSelected = selectedPeople.has(person.id)
                const isDisabled = !isSelected && selectedPeople.size >= MAX_PEOPLE
                const role =
                  person.known_for_department === 'Directing' ? 'Режиссёр' : 'Актёр'
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

        {/* Selected people chips */}
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
                  onClick={() =>
                    setSelectedPeople((prev) => {
                      const next = new Map(prev)
                      next.delete(p.tmdbId)
                      return next
                    })
                  }
                  className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/10 text-sm"
                >
                  <div className="relative w-5 h-5 rounded-full overflow-hidden bg-muted shrink-0">
                    {p.profilePath && (
                      <Image
                        src={getProfileUrl(p.profilePath, 'w45') ?? ''}
                        alt={p.name}
                        fill
                        sizes="20px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <span className="font-medium">{p.name}</span>
                  <X className="w-3 h-3 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {searchQuery.trim().length < 2 && selectedPeopleList.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">
            Введи имя актёра или режиссёра — мы подберём фильмы с ними в ленте
          </p>
        )}
      </div>
    </div>
  )
}
