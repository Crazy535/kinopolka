'use client'

import { useTransition } from 'react'
import { Check } from 'lucide-react'
import { markAsWatched, unmarkAsWatched } from '@/actions/watchlist'

interface WatchCheckButtonProps {
  id: string
  watchedAt: Date | null
}

export function WatchCheckButton({ id, watchedAt }: WatchCheckButtonProps) {
  const [isPending, startTransition] = useTransition()
  const isWatched = watchedAt !== null

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    e.stopPropagation()
    startTransition(async () => {
      if (isWatched) {
        await unmarkAsWatched(id)
      } else {
        await markAsWatched(id)
      }
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isWatched ? 'Убрать отметку' : 'Отметить просмотренным'}
      className={`absolute right-2 top-2 z-10 flex size-7 items-center justify-center rounded-full border transition-all duration-200 disabled:opacity-60 ${
        isWatched
          ? 'border-primary bg-primary text-primary-foreground shadow-md'
          : 'border-white/30 bg-black/40 text-white/70 backdrop-blur-sm hover:border-primary/60 hover:bg-primary/20 hover:text-primary'
      }`}
    >
      <Check className="size-3.5" strokeWidth={2.5} />
    </button>
  )
}
