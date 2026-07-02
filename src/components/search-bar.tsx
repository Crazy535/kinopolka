'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X, TrendingUp, SearchX } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl } from '@/lib/tmdb-image'
import { useSearch, POPULAR_QUERIES } from '@/hooks/use-search'

export function SearchBar() {
  const router = useRouter()
  const [mobileExpanded, setMobileExpanded] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const { query, results, isLoading, handleQueryChange, selectQuery, reset } = useSearch()
  const desktopInputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const blurTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    e.preventDefault()
    const trimmed = query.trim()
    const tmdbIdMatch = trimmed.match(/^#(\d+)$/)
    if (tmdbIdMatch) {
      router.push(`/movie/${tmdbIdMatch[1]}`)
      close()
      return
    }
    if (trimmed.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(trimmed)}`)
      close()
    }
  }

  function handleFocus() {
    if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    setDropdownOpen(true)
  }

  function handleBlur() {
    blurTimerRef.current = setTimeout(() => setDropdownOpen(false), 160)
  }

  const close = useCallback(() => {
    setMobileExpanded(false)
    setDropdownOpen(false)
    reset()
  }, [reset])

  function openMobile() {
    setMobileExpanded(true)
    setTimeout(() => mobileInputRef.current?.focus(), 50)
  }

  function handlePopularClick(q: string) {
    selectQuery(q)
    desktopInputRef.current?.focus()
    mobileInputRef.current?.focus()
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') close()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [close])

  useEffect(() => {
    return () => {
      if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
    }
  }, [])

  const showPopular = dropdownOpen && query.length < 2
  const showResults = dropdownOpen && query.length >= 2 && !/^#\d+$/.test(query.trim())
  const showDropdown = showPopular || showResults

  const sharedInputProps = {
    type: 'text' as const,
    value: query,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleQueryChange(e.target.value),
    onKeyDown: handleKeyDown,
    onFocus: handleFocus,
    onBlur: handleBlur,
    placeholder: 'Фильм, сериал...',
    autoComplete: 'off',
  }

  return (
    <div ref={containerRef} className="relative">
      {/* Desktop: always-visible inline input */}
      <div className="hidden md:flex items-center">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={desktopInputRef}
            {...sharedInputProps}
            placeholder="Поиск фильма или сериала..."
            className="h-9 w-52 rounded-lg border border-input bg-muted/40 pl-8 pr-7 text-sm text-foreground placeholder:text-muted-foreground/70 transition-all focus:w-64 focus:border-ring focus:bg-background focus:outline-none focus:ring-1 focus:ring-ring/25 lg:w-56 lg:focus:w-72"
          />
          {query ? (
            <button
              type="button"
              onClick={() => { reset(); desktopInputRef.current?.focus() }}
              aria-label="Очистить поиск"
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 transition-colors hover:text-muted-foreground"
            >
              <X className="size-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground/60">
              ⌘K
            </kbd>
          )}
        </div>
      </div>

      {/* Mobile: toggle icon → expanded input */}
      <div className="md:hidden">
        {!mobileExpanded ? (
          <button
            type="button"
            onClick={openMobile}
            aria-label="Поиск"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <Search className="size-4" />
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                ref={mobileInputRef}
                {...sharedInputProps}
                className="h-10 w-52 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none sm:w-72"
              />
            </div>
            <button
              type="button"
              onClick={close}
              aria-label="Закрыть поиск"
              className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        )}
      </div>

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-72 overflow-hidden rounded-xl border border-border bg-popover shadow-lg sm:w-80 md:w-80">
          {showPopular ? (
            <div className="p-3">
              <div className="mb-2.5 flex items-center gap-1.5 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="size-3" />
                Популярное
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_QUERIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handlePopularClick(q) }}
                    className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
              <Link
                href="/search"
                onMouseDown={(e) => e.preventDefault()}
                onClick={close}
                className="mt-3 flex items-center gap-1 text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
              >
                <Search className="size-3" />
                Расширенный поиск
              </Link>
            </div>
          ) : isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Поиск...</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-4 py-6 text-center">
              <SearchX className="size-5 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Ничего не найдено</p>
            </div>
          ) : (
            <>
              <ul>
                {results.map((r) => {
                  const href = r.media_type === 'movie' ? `/movie/${r.id}` : `/tv/${r.id}`
                  const poster = r.poster_path ? getPosterUrl(r.poster_path, 'w185') : null
                  return (
                    <li key={`${r.media_type}-${r.id}`}>
                      <Link
                        href={href}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={close}
                        className="flex items-center gap-3 px-3 py-2 transition-colors hover:bg-muted"
                      >
                        <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                          {poster && (
                            <Image
                              src={poster}
                              alt={r.title}
                              fill
                              sizes="32px"
                              className="object-cover"
                            />
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">{r.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {r.media_type === 'movie' ? 'Фильм' : 'Сериал'}
                            {r.year ? ` · ${r.year}` : ''}
                          </p>
                        </div>
                      </Link>
                    </li>
                  )
                })}
              </ul>
              <div className="flex items-center justify-between border-t border-border px-3 py-2">
                <Link
                  href={`/search?q=${encodeURIComponent(query.trim())}`}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={close}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Search className="size-3" />
                  Все результаты по «{query}» →
                </Link>
                <Link
                  href="/search"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={close}
                  className="text-xs text-muted-foreground/70 transition-colors hover:text-foreground"
                >
                  Фильтры
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
