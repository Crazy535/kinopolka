'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl } from '@/lib/tmdb-image'
import { trackSearchUsed } from '@/lib/analytics'

interface SearchResult {
  id: number
  media_type: 'movie' | 'tv'
  title: string
  poster_path: string | null
  year: string
}

export function SearchBar() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([])
      return
    }
    setIsLoading(true)
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`)
      const data = (await res.json()) as { results: SearchResult[] }
      setResults(data.results)
      trackSearchUsed(q.length, data.results.length)
    } catch {
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  function handleQueryChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => void search(val), 300)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && query.trim().length >= 2) {
      e.preventDefault()
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      handleClose()
    }
  }

  function handleOpen() {
    setIsOpen(true)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  function handleClose() {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') handleClose()
    }
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        handleClose()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('mousedown', onClickOutside)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('mousedown', onClickOutside)
    }
  }, [])

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
    }
  }, [])

  const showDropdown = isOpen && query.length >= 2

  return (
    <div ref={containerRef} className="relative">
      {!isOpen ? (
        <button
          type="button"
          onClick={handleOpen}
          aria-label="Поиск"
          className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <Search className="size-4" />
        </button>
      ) : (
        <div className="flex items-center gap-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleQueryChange}
              onKeyDown={handleKeyDown}
              placeholder="Фильм или сериал..."
              className="h-10 w-56 rounded-lg border border-input bg-background pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none sm:w-80"
            />
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Закрыть поиск"
            className="flex h-10 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {showDropdown && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-80 overflow-hidden rounded-xl border border-border bg-popover shadow-lg sm:w-96">
          {isLoading ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Поиск...</div>
          ) : results.length === 0 ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">Ничего не найдено</div>
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
                        onClick={handleClose}
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
                  onClick={handleClose}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Search className="size-3" />
                  Все результаты по «{query}» →
                </Link>
                <Link
                  href="/search"
                  onClick={handleClose}
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
