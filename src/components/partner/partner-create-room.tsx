'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { GenrePicker } from './genre-picker'
import { trackPartnerRoomCreated } from '@/lib/analytics'

interface Props {
  hasTasteProfile: boolean
  genreIds: number[]
}

export function PartnerCreateRoom({ hasTasteProfile, genreIds }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function createRoom(selectedGenreIds?: number[]) {
    setLoading(true)
    setError(null)
    try {
      const ids = selectedGenreIds ?? genreIds
      const res = await fetch('/api/partner/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genreIds: ids }),
      })
      if (!res.ok) throw new Error('Failed to create room')
      const { code } = await res.json()
      trackPartnerRoomCreated()
      router.push(`/partner/${code}`)
    } catch {
      setError('Не удалось создать комнату. Попробуйте ещё раз.')
      setLoading(false)
    }
  }

  if (!hasTasteProfile) {
    return (
      <div className="space-y-4">
        <p className="text-center text-muted-foreground text-sm">
          Расскажите о своих предпочтениях, чтобы начать
        </p>
        <GenrePicker onConfirm={createRoom} loading={loading} />
        {error && <p className="text-center text-destructive text-sm">{error}</p>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        onClick={() => createRoom()}
        disabled={loading}
        className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground text-lg font-bold rounded-2xl transition-all"
      >
        {loading ? 'Создаём комнату...' : 'Создать комнату'}
      </button>
      {error && <p className="text-center text-destructive text-sm">{error}</p>}
      <p className="text-center text-muted-foreground text-xs max-w-xs">
        Создайте комнату и отправьте ссылку партнёру — подберём фильм для обоих за 30 сек
      </p>
    </div>
  )
}
