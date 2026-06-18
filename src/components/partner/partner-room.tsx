'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { getSupabaseClient } from '@/lib/supabase-client'
import { GenrePicker } from './genre-picker'
import { PartnerResults, PartnerResultsSkeleton } from './partner-results'
import type { RecommendationItem } from '@/types/quiz'

interface RoomState {
  code: string
  status: 'waiting' | 'active' | 'done'
  host: { id: string; name: string | null; image: string | null } | null
  guest: { id: string; name: string | null; image: string | null } | null
  hostGenreIds: number[]
  guestGenreIds: number[]
  items: RecommendationItem[] | null
}

interface Props {
  code: string
  userId: string
  hasTasteProfile: boolean
  initialRoom: RoomState
  baseUrl: string
  userGenreIds?: number[]
}

export function PartnerRoom({ code, userId, hasTasteProfile, initialRoom, baseUrl, userGenreIds = [] }: Props) {
  const [room, setRoom] = useState<RoomState>(initialRoom)
  const [joining, setJoining] = useState(false)
  const [copied, setCopied] = useState(false)
  const [fetchingResults, setFetchingResults] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [currentItems, setCurrentItems] = useState<RecommendationItem[] | null>(null)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const supabase = getSupabaseClient()

  const inviteUrl = `${baseUrl}/partner/${code}`
  const isHost = room.host?.id === userId

  const fetchRoom = useCallback(async () => {
    const res = await fetch(`/api/partner/rooms/${code}`, { cache: 'no-store' })
    if (!res.ok) return
    const data: RoomState = await res.json()
    setRoom(data)

    if (data.status === 'done' && !data.items) {
      setFetchingResults(true)
      const r2 = await fetch(`/api/partner/rooms/${code}`, { cache: 'no-store' })
      if (r2.ok) {
        const d2: RoomState = await r2.json()
        setRoom(d2)
      }
      setFetchingResults(false)
    }

    if (data.status === 'done') {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [code])

  // Polling — 2s while waiting, stop when done
  useEffect(() => {
    if (room.status === 'done') return
    pollRef.current = setInterval(fetchRoom, 2000)
    return () => {
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [fetchRoom, room.status])

  // Supabase Realtime broadcast — instant update on top of polling
  useEffect(() => {
    if (room.status === 'done') return

    const channel = supabase
      .channel(`partner:${code}`)
      .on('broadcast', { event: 'update' }, () => {
        void fetchRoom()
      })
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [code, supabase, fetchRoom, room.status])

  async function handleJoin(genreIds?: number[]) {
    setJoining(true)
    try {
      const res = await fetch(`/api/partner/rooms/${code}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genreIds: genreIds ?? [] }),
      })
      if (res.ok) {
        await supabase.channel(`partner:${code}`).send({
          type: 'broadcast',
          event: 'update',
          payload: { joined: true },
        })
        await fetchRoom()
      }
    } finally {
      setJoining(false)
    }
  }

  async function handleRefresh() {
    const displayedItems = currentItems ?? room.items ?? []
    const excludeIds = displayedItems.map(({ movie }) => movie.id)
    setRefreshing(true)
    try {
      const res = await fetch(`/api/partner/rooms/${code}/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ excludeIds }),
      })
      if (res.ok) {
        const { items } = await res.json()
        setCurrentItems(items)
      }
    } finally {
      setRefreshing(false)
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback: select text
    }
  }

  // ─── DONE state ───────────────────────────────────────────────────────────
  if (room.status === 'done') {
    const displayItems = currentItems ?? room.items
    if (fetchingResults || !displayItems) {
      return (
        <div>
          <div className="mb-8 text-center">
            <div className="inline-block w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-muted-foreground">Загружаем результаты...</p>
          </div>
          <PartnerResultsSkeleton />
        </div>
      )
    }
    return (
      <PartnerResults
        items={displayItems}
        hostName={room.host?.name ?? null}
        guestName={room.guest?.name ?? null}
        hostGenreIds={room.hostGenreIds ?? []}
        guestGenreIds={room.guestGenreIds ?? []}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />
    )
  }

  // ─── WAITING state (host view) ────────────────────────────────────────────
  if (isHost) {
    return (
      <div className="flex flex-col items-center gap-8 text-center">
        <div>
          <div className="inline-block w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-foreground">Ожидаем партнёра...</h2>
          <p className="mt-2 text-muted-foreground">Отправьте ссылку другу, чтобы начать подбор</p>
        </div>

        <div className="w-full max-w-md rounded-xl border border-border bg-card p-4">
          <p className="mb-2 text-xs text-muted-foreground">Ссылка для партнёра</p>
          <div className="flex items-center gap-2">
            <span className="flex-1 truncate font-mono text-sm text-foreground">{inviteUrl}</span>
            <button
              onClick={copyLink}
              className="shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs text-primary-foreground transition-all hover:bg-primary/90"
            >
              {copied ? 'Скопировано!' : 'Копировать'}
            </button>
          </div>
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Код комнаты: <span className="font-mono tracking-widest text-foreground">{code}</span>
          </p>
        </div>
      </div>
    )
  }

  // ─── GUEST view: join room ────────────────────────────────────────────────
  const guestAlreadyJoined = room.guest?.id === userId

  if (guestAlreadyJoined) {
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <div className="inline-block w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        <h2 className="text-2xl font-bold text-foreground">Подбираем фильмы...</h2>
        <p className="text-muted-foreground">Ещё секунда</p>
      </div>
    )
  }

  // Guest needs to join
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div>
        <h2 className="text-2xl font-bold text-foreground">
          Вечер с{room.host?.name ? ` ${room.host.name}` : ' партнёром'}
        </h2>
        <p className="mt-2 text-muted-foreground">Выберите свои предпочтения, чтобы найти общий фильм</p>
      </div>

      {hasTasteProfile ? (
        <button
          onClick={() => handleJoin()}
          disabled={joining}
          className="rounded-xl bg-primary px-8 py-3 font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50"
        >
          {joining ? 'Подбираем...' : 'Присоединиться'}
        </button>
      ) : (
        <GenrePicker onConfirm={handleJoin} loading={joining} />
      )}
    </div>
  )
}
