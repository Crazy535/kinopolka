'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const GENRES = [
  { id: 28,    name: 'Боевик' },
  { id: 35,    name: 'Комедия' },
  { id: 18,    name: 'Драма' },
  { id: 27,    name: 'Ужасы' },
  { id: 878,   name: 'Фантастика' },
  { id: 10749, name: 'Мелодрама' },
  { id: 80,    name: 'Криминал' },
  { id: 9648,  name: 'Мистика' },
  { id: 16,    name: 'Мультфильм' },
  { id: 12,    name: 'Приключения' },
  { id: 53,    name: 'Триллер' },
  { id: 99,    name: 'Документальный' },
]

const CURRENT_YEAR = new Date().getFullYear()

export function SearchFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const type = searchParams.get('type') ?? ''
  const genre = searchParams.get('genre') ?? ''
  const year = searchParams.get('year') ?? ''

  function update(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    params.delete('page')
    router.push(`/search?${params.toString()}`)
  }

  const typeOptions: { value: string; label: string }[] = [
    { value: '', label: 'Все' },
    { value: 'movie', label: 'Фильмы' },
    { value: 'tv', label: 'Сериалы' },
  ]

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {typeOptions.map((t) => (
        <button
          key={t.value}
          type="button"
          onClick={() => update('type', t.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            type === t.value
              ? 'border-primary bg-primary/10 text-primary'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          }`}
        >
          {t.label}
        </button>
      ))}

      <div className="h-4 w-px bg-border" />

      <select
        value={genre}
        onChange={(e) => update('genre', e.target.value)}
        className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground focus:border-primary focus:outline-none"
      >
        <option value="">Любой жанр</option>
        {GENRES.map((g) => (
          <option key={g.id} value={String(g.id)}>
            {g.name}
          </option>
        ))}
      </select>

      <input
        type="number"
        value={year}
        min={1900}
        max={CURRENT_YEAR}
        placeholder="Год"
        onChange={(e) => update('year', e.target.value)}
        className="w-20 rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
      />

      {(type || genre || year) && (
        <button
          type="button"
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString())
            params.delete('type')
            params.delete('genre')
            params.delete('year')
            params.delete('page')
            router.push(`/search?${params.toString()}`)
          }}
          className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-destructive/50 hover:text-destructive"
        >
          Сбросить
        </button>
      )}
    </div>
  )
}
