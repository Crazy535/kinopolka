'use client'

import { useState, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, Loader2, AlertCircle, RotateCcw } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { getPosterUrl } from '@/lib/tmdb-image'
import type { FilmDetectiveResponse, DetectiveCandidate } from '@/app/api/film-detective/route'

type DetectiveState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'found'; candidates: DetectiveCandidate[]; uncertain: boolean }
  | { status: 'error'; message: string }

const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]

const EXAMPLES = [
  'Фильм где мужчина просыпается и заново проживает один и тот же день',
  'Анимация Pixar про мальчика который попал в мир мёртвых',
  'Триллер где герой понимает что сам является тем, кого ищет',
]

function ConfidenceBadge({ confidence }: { confidence: number }) {
  const pct = Math.round(confidence * 100)
  const color =
    confidence >= 0.8
      ? 'bg-rating-high/20 text-rating-high'
      : confidence >= 0.5
        ? 'bg-rating-mid/20 text-rating-mid'
        : 'bg-muted text-muted-foreground'
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${color}`}>{pct}% уверен</span>
  )
}

function CandidateCard({ candidate, rank }: { candidate: DetectiveCandidate; rank: number }) {
  const posterUrl = getPosterUrl(candidate.poster_path, 'w342')
  const displayTitle = candidate.title_ru || candidate.title

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: rank * 0.08, duration: 0.4, ease: EXPO_OUT }}
      className="flex gap-4 rounded-xl border border-border bg-card p-4"
    >
      {/* Poster */}
      <div className="relative h-[120px] w-20 shrink-0 overflow-hidden rounded-lg bg-muted">
        {posterUrl ? (
          <Image src={posterUrl} alt={displayTitle} fill sizes="80px" className="object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center text-2xl text-muted-foreground">🎬</div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-1 flex-col gap-1.5 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-semibold leading-tight text-foreground truncate">{displayTitle}</p>
            {candidate.title_ru && (
              <p className="text-xs text-muted-foreground truncate">{candidate.title} · {candidate.year}</p>
            )}
            {!candidate.title_ru && (
              <p className="text-xs text-muted-foreground">{candidate.year}</p>
            )}
          </div>
          <ConfidenceBadge confidence={candidate.confidence} />
        </div>

        {candidate.vote_average && (
          <p className="text-xs text-muted-foreground">
            Рейтинг: <span className="text-foreground font-medium">{candidate.vote_average.toFixed(1)}</span>
          </p>
        )}

        <p className="text-sm text-muted-foreground leading-snug line-clamp-3">{candidate.reasoning}</p>

        {candidate.providers_ru.length > 0 && (
          <p className="text-[11px] text-muted-foreground">{candidate.providers_ru.join(' · ')}</p>
        )}

        {candidate.tmdb_id && (
          <Link
            href={`/movie/${candidate.tmdb_id}`}
            className="mt-1 inline-flex w-fit items-center gap-1 rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
          >
            Подробнее →
          </Link>
        )}
      </div>
    </motion.div>
  )
}

export function DetectiveContainer() {
  const [state, setState] = useState<DetectiveState>({ status: 'idle' })
  const [description, setDescription] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  async function handleSearch() {
    const trimmed = description.trim()
    if (trimmed.length < 5) return

    setState({ status: 'loading' })
    try {
      const res = await fetch('/api/film-detective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: trimmed }),
      })
      const data: FilmDetectiveResponse = await res.json()
      if (!res.ok) {
        setState({ status: 'error', message: (data as { error?: string }).error ?? 'Ошибка поиска' })
        return
      }
      setState({ status: 'found', candidates: data.candidates, uncertain: data.uncertain })
    } catch {
      setState({ status: 'error', message: 'Нет соединения. Попробуйте снова.' })
    }
  }

  function handleReset() {
    setState({ status: 'idle' })
    setDescription('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function handleExample(ex: string) {
    setDescription(ex)
    textareaRef.current?.focus()
  }

  return (
    <div className="mx-auto max-w-2xl">
      <AnimatePresence mode="wait">
        {state.status !== 'found' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: EXPO_OUT }}
            className="flex flex-col gap-5"
          >
            <div className="relative">
              <textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void handleSearch()
                }}
                placeholder="Опиши фильм как можешь — мы найдём его..."
                rows={4}
                className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-colors"
              />
              <p className="absolute bottom-3 right-3 text-[11px] text-muted-foreground/60">
                ⌘+Enter
              </p>
            </div>

            <button
              type="button"
              onClick={() => void handleSearch()}
              disabled={description.trim().length < 5 || state.status === 'loading'}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground transition-all disabled:cursor-not-allowed disabled:opacity-50 hover:opacity-90 hover:shadow-[0_4px_20px_oklch(0.58_0.22_18_/_0.30)] active:scale-[0.99]"
            >
              {state.status === 'loading' ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Детектив расследует...
                </>
              ) : (
                <>
                  <Search className="size-4" />
                  Найти фильм
                </>
              )}
            </button>

            {state.status === 'error' && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
              >
                <AlertCircle className="size-4 shrink-0" />
                {state.message}
              </motion.div>
            )}

            {/* Examples */}
            {state.status === 'idle' && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-medium text-muted-foreground">Например:</p>
                <div className="flex flex-col gap-1.5">
                  {EXAMPLES.map((ex) => (
                    <button
                      key={ex}
                      type="button"
                      onClick={() => handleExample(ex)}
                      className="rounded-lg border border-border/60 bg-card px-3 py-2 text-left text-xs text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
                    >
                      {ex}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {state.status === 'found' && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: EXPO_OUT }}
            className="flex flex-col gap-5"
          >
            {/* Description recap */}
            <div className="rounded-xl border border-border/60 bg-muted/40 px-4 py-3">
              <p className="text-xs text-muted-foreground">Вы искали:</p>
              <p className="mt-0.5 text-sm text-foreground">{description}</p>
            </div>

            {/* Header */}
            {state.candidates.length > 0 ? (
              <div>
                <h2 className="font-heading text-xl font-bold sm:text-2xl">
                  {state.candidates[0].confidence >= 0.8
                    ? '🎯 Нашли!'
                    : state.candidates[0].confidence >= 0.5
                      ? '🤔 Возможно, это...'
                      : '🔍 Мы неуверены, но...'}
                </h2>
                {state.uncertain && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    Добавь больше деталей — год, страну, актёра или сцену — и мы найдём точнее.
                  </p>
                )}
              </div>
            ) : (
              <div>
                <h2 className="font-heading text-xl font-bold">🕵️ Детектив зашёл в тупик</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Попробуй добавить: год выхода, страну, имя актёра, запоминающуюся сцену или жанр.
                </p>
              </div>
            )}

            {/* Candidates */}
            <div className="flex flex-col gap-3">
              {state.candidates.map((c, i) => (
                <CandidateCard key={`${c.title}-${c.year}`} candidate={c} rank={i} />
              ))}
            </div>

            {/* Reset */}
            <button
              type="button"
              onClick={handleReset}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
            >
              <RotateCcw className="size-4" />
              Искать другой фильм
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
