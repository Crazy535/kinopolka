'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl } from '@/lib/tmdb-image'
import { CheckCircle2, XCircle, Eye, ChevronDown } from 'lucide-react'

interface DailyGameClues {
  year: string | null
  genres: string[]
  runtime: string | null
  countries: string[]
  cast: string[]
}

interface DailyGameData {
  date: string
  id: number
  title: string
  originalTitle: string
  posterPath: string | null
  clues: DailyGameClues
}

const CLUE_LABELS = [
  { key: 'year',      label: 'Год выхода',       render: (c: DailyGameClues) => c.year ?? '—' },
  { key: 'genres',    label: 'Жанры',            render: (c: DailyGameClues) => c.genres.join(', ') || '—' },
  { key: 'runtime',   label: 'Хронометраж',      render: (c: DailyGameClues) => c.runtime ?? '—' },
  { key: 'countries', label: 'Страна',           render: (c: DailyGameClues) => c.countries.join(', ') || '—' },
  { key: 'cast',      label: 'Первый актёр',     render: (c: DailyGameClues) => c.cast[0] ?? '—' },
]

const MAX_CLUES = CLUE_LABELS.length
const LS_KEY = (date: string) => `kinopolka-daily-${date}`

function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^а-яёa-z0-9\s]/gi, '').replace(/\s+/g, ' ').trim()
}

function titlesMatch(guess: string, title: string, originalTitle?: string): boolean {
  const g = normalizeTitle(guess)
  return g === normalizeTitle(title) || (originalTitle ? g === normalizeTitle(originalTitle) : false)
}

type GameState = 'playing' | 'won' | 'lost'

interface SavedState {
  revealedCount: number
  gameState: GameState
  guesses: string[]
}

export function DailyGameContainer() {
  const [game, setGame] = useState<DailyGameData | null>(null)
  const [loading, setLoading] = useState(true)
  const [revealedCount, setRevealedCount] = useState(1)
  const [guess, setGuess] = useState('')
  const [guesses, setGuesses] = useState<string[]>([])
  const [gameState, setGameState] = useState<GameState>('playing')
  const [shake, setShake] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/game/daily')
      .then((r) => r.json())
      .then((data: DailyGameData) => {
        setGame(data)
        const saved: SavedState | null = (() => {
          try { return JSON.parse(localStorage.getItem(LS_KEY(data.date)) ?? 'null') } catch { return null }
        })()
        if (saved) {
          setRevealedCount(saved.revealedCount)
          setGameState(saved.gameState)
          setGuesses(saved.guesses)
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  function save(rc: number, gs: GameState, gs2: string[]) {
    if (!game) return
    localStorage.setItem(LS_KEY(game.date), JSON.stringify({ revealedCount: rc, gameState: gs, guesses: gs2 }))
  }

  function handleGuess() {
    if (!game || gameState !== 'playing' || !guess.trim()) return
    const newGuesses = [...guesses, guess.trim()]
    setGuesses(newGuesses)
    setGuess('')

    if (titlesMatch(guess, game.title, game.originalTitle)) {
      setGameState('won')
      save(revealedCount, 'won', newGuesses)
    } else {
      const nextRevealed = revealedCount + 1
      if (nextRevealed > MAX_CLUES) {
        setGameState('lost')
        save(MAX_CLUES, 'lost', newGuesses)
        setRevealedCount(MAX_CLUES)
      } else {
        setRevealedCount(nextRevealed)
        save(nextRevealed, 'playing', newGuesses)
        setShake(true)
        setTimeout(() => setShake(false), 600)
      }
    }
    inputRef.current?.focus()
  }

  if (loading) {
    return (
      <div className="flex min-h-[320px] items-center justify-center">
        <div className="size-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    )
  }

  if (!game) {
    return (
      <div className="py-12 text-center text-muted-foreground">
        Не удалось загрузить загадку. Попробуйте позже.
      </div>
    )
  }

  const posterUrl = game.posterPath ? getPosterUrl(game.posterPath, 'w342') : null
  const cluesVisible = CLUE_LABELS.slice(0, revealedCount)
  const progressPct = Math.round((revealedCount / MAX_CLUES) * 100)

  return (
    <div className="mx-auto max-w-lg">
      {/* Progress */}
      <div className="mb-6 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">
          {revealedCount} / {MAX_CLUES} подсказок
        </span>
      </div>

      {/* Clue cards */}
      <div className="mb-6 flex flex-col gap-2">
        {CLUE_LABELS.map((clue, i) => {
          const revealed = i < revealedCount
          return (
            <div
              key={clue.key}
              className={`rounded-xl border p-3 transition-all duration-500 ${
                revealed
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-muted/30 opacity-40'
              }`}
            >
              <p className="mb-0.5 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                {clue.label}
              </p>
              <p className={`text-sm font-medium ${revealed ? '' : 'select-none blur-sm'}`}>
                {revealed ? clue.render(game.clues) : '████████'}
              </p>
            </div>
          )
        })}
      </div>

      {/* Guess input */}
      {gameState === 'playing' && (
        <div className={`flex gap-2 ${shake ? 'animate-shake' : ''}`}>
          <input
            ref={inputRef}
            type="text"
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleGuess() }}
            placeholder="Название фильма..."
            className="flex-1 rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
          />
          <button
            onClick={handleGuess}
            disabled={!guess.trim()}
            className="rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Угадать
          </button>
        </div>
      )}

      {/* Guess history */}
      {guesses.length > 0 && (
        <div className="mt-3 flex flex-col gap-1">
          {guesses.map((g, i) => {
            const isLast = i === guesses.length - 1
            const correct = isLast && gameState === 'won'
            return (
              <div key={i} className="flex items-center gap-2 text-sm">
                {correct
                  ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" />
                  : <XCircle className="size-4 shrink-0 text-destructive" />
                }
                <span className={correct ? 'text-emerald-500 font-medium' : 'text-muted-foreground line-through'}>
                  {g}
                </span>
              </div>
            )
          })}
        </div>
      )}

      {/* Result */}
      {gameState !== 'playing' && (
        <div className={`mt-6 rounded-xl border p-5 ${gameState === 'won' ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-destructive/30 bg-destructive/5'}`}>
          <div className="flex gap-4">
            {posterUrl && (
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg">
                <Image src={posterUrl} alt={game.title} fill sizes="64px" className="object-cover" />
              </div>
            )}
            <div>
              <p className={`mb-1 text-sm font-semibold ${gameState === 'won' ? 'text-emerald-500' : 'text-destructive'}`}>
                {gameState === 'won' ? `Угадано за ${guesses.length} попытк${guesses.length === 1 ? 'у' : guesses.length < 5 ? 'и' : ''}!` : 'Не угадано'}
              </p>
              <p className="font-heading text-lg font-bold leading-tight">{game.title}</p>
              {game.originalTitle !== game.title && (
                <p className="text-xs text-muted-foreground">{game.originalTitle}</p>
              )}
              <Link
                href={`/movie/${game.id}`}
                className="mt-3 inline-flex items-center gap-1 text-sm text-primary hover:underline"
              >
                <Eye className="size-3.5" />
                Смотреть фильм →
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Next clue button */}
      {gameState === 'playing' && revealedCount < MAX_CLUES && (
        <button
          onClick={() => {
            const next = revealedCount + 1
            setRevealedCount(next)
            save(next, 'playing', guesses)
          }}
          className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-lg border border-border py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronDown className="size-4" />
          Следующая подсказка (осталось {MAX_CLUES - revealedCount})
        </button>
      )}
    </div>
  )
}
