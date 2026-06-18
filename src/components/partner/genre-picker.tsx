'use client'

import { useState } from 'react'

const GENRES = [
  { id: 28, label: 'Боевик' },
  { id: 35, label: 'Комедия' },
  { id: 18, label: 'Драма' },
  { id: 27, label: 'Ужасы' },
  { id: 10749, label: 'Романтика' },
  { id: 878, label: 'Фантастика' },
  { id: 16, label: 'Анимация' },
  { id: 53, label: 'Триллер' },
  { id: 12, label: 'Приключения' },
  { id: 9648, label: 'Детектив' },
]

interface Props {
  onConfirm: (genreIds: number[]) => void
  loading?: boolean
}

export function GenrePicker({ onConfirm, loading }: Props) {
  const [selected, setSelected] = useState<Set<number>>(new Set())

  function toggle(id: number) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div className="flex flex-col items-center gap-6">
      <p className="text-center text-muted-foreground text-sm">
        Выберите жанры, которые вам нравятся (1+)
      </p>
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {GENRES.map((g) => (
          <button
            key={g.id}
            onClick={() => toggle(g.id)}
            className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
              selected.has(g.id)
                ? 'bg-primary border-primary text-primary-foreground'
                : 'border-border text-foreground hover:border-primary'
            }`}
          >
            {g.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => onConfirm([...selected])}
        disabled={selected.size === 0 || loading}
        className="px-8 py-3 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground font-semibold rounded-xl transition-all"
      >
        {loading ? 'Подбираем...' : 'Продолжить'}
      </button>
    </div>
  )
}
