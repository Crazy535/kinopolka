'use client'

import { useState } from 'react'
import { Heart, Check, Loader2 } from 'lucide-react'
import { addGenresToTaste } from '@/actions/taste'

interface Props {
  genreIds: number[]
}

type State = 'idle' | 'loading' | 'done'

export function AddToTasteButton({ genreIds }: Props) {
  const [state, setState] = useState<State>('idle')

  async function handleClick() {
    if (state !== 'idle' || genreIds.length === 0) return
    setState('loading')
    try {
      await addGenresToTaste(genreIds)
      setState('done')
    } catch {
      setState('idle')
    }
  }

  if (state === 'done') {
    return (
      <div className="flex items-center gap-1.5 text-sm text-emerald-500">
        <Check className="h-4 w-4" />
        <span>Добавлено в вкусы</span>
      </div>
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={state === 'loading'}
      className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground disabled:opacity-50"
    >
      {state === 'loading' ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Heart className="h-4 w-4" />
      )}
      В мой вкус
    </button>
  )
}
