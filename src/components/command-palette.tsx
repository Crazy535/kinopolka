'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, TrendingUp, SearchX } from 'lucide-react'
import Image from 'next/image'
import { getPosterUrl } from '@/lib/tmdb-image'
import { useSearch, POPULAR_QUERIES } from '@/hooks/use-search'

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const { query, results, isLoading, handleQueryChange, selectQuery, reset } = useSearch()

  const close = useCallback(() => {
    setOpen(false)
    reset()
  }, [reset])

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey
      if (isMod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      } else if (e.key === 'Escape') {
        setOpen(false)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!open) return
    const id = setTimeout(() => inputRef.current?.focus(), 20)
    return () => clearTimeout(id)
  }, [open])

  function go(href: string) {
    close()
    router.push(href)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key !== 'Enter') return
    const trimmed = query.trim()
    const tmdbIdMatch = trimmed.match(/^#(\d+)$/)
    if (tmdbIdMatch) {
      go(`/movie/${tmdbIdMatch[1]}`)
      return
    }
    if (trimmed.length >= 2) go(`/search?q=${encodeURIComponent(trimmed)}`)
  }

  if (!open) return null

  const showPopular = query.length < 2

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center bg-background/80 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={close}
    >
      <div
        className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-popover shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative border-b border-border">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Фильм, сериал..."
            autoComplete="off"
            className="h-14 w-full bg-transparent pl-11 pr-4 text-[15px] text-foreground placeholder:text-muted-foreground/70 focus:outline-none"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {showPopular ? (
            <div className="p-2">
              <div className="mb-2.5 flex items-center gap-1.5 px-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                <TrendingUp className="size-3" />
                Популярное
              </div>
              <div className="flex flex-wrap gap-1.5 px-1">
                {POPULAR_QUERIES.map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => selectQuery(q)}
                    className="rounded-full border border-border/60 bg-muted/50 px-2.5 py-0.5 text-xs text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : isLoading ? (
            <div className="px-3 py-8 text-center text-sm text-muted-foreground">Поиск...</div>
          ) : results.length === 0 ? (
            <div className="flex flex-col items-center gap-2 px-3 py-10 text-center">
              <SearchX className="size-5 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Ничего не найдено</p>
            </div>
          ) : (
            <ul>
              {results.map((r) => {
                const href = r.media_type === 'movie' ? `/movie/${r.id}` : `/tv/${r.id}`
                const poster = r.poster_path ? getPosterUrl(r.poster_path, 'w185') : null
                return (
                  <li key={`${r.media_type}-${r.id}`}>
                    <button
                      type="button"
                      onClick={() => go(href)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors hover:bg-muted"
                    >
                      <div className="relative h-12 w-8 shrink-0 overflow-hidden rounded bg-muted">
                        {poster && (
                          <Image src={poster} alt={r.title} fill sizes="32px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{r.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {r.media_type === 'movie' ? 'Фильм' : 'Сериал'}
                          {r.year ? ` · ${r.year}` : ''}
                        </p>
                      </div>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-4 py-2 text-[11px] text-muted-foreground/60">
          <span>↵ выбрать</span>
          <span>esc закрыть</span>
        </div>
      </div>
    </div>
  )
}
