'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Tv, Loader2, AlertCircle, Search, ChevronLeft } from 'lucide-react'
import type { M3uChannel } from '@/lib/iptv/parse-m3u'

interface Playlist {
  id: string
  name: string
  sourceType: string
  sourceUrl: string | null
}

interface Props {
  playlists: Playlist[]
  onDelete: (id: string) => void
}

export function IptvPlayer({ playlists, onDelete }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const hlsRef = useRef<import('hls.js').default | null>(null)

  const [activePl, setActivePl] = useState<Playlist | null>(playlists[0] ?? null)
  const [channels, setChannels] = useState<M3uChannel[]>([])
  const [activeChannel, setActiveChannel] = useState<M3uChannel | null>(null)
  const [loadingChannels, setLoadingChannels] = useState(false)
  const [channelsError, setChannelsError] = useState('')
  const [query, setQuery] = useState('')
  const [showList, setShowList] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  const loadChannels = useCallback(async (pl: Playlist) => {
    setLoadingChannels(true)
    setChannelsError('')
    setChannels([])
    setActiveChannel(null)
    try {
      const res = await fetch(`/api/iptv/${pl.id}/channels`)
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d.error ?? 'Ошибка загрузки')
      }
      const data = await res.json()
      setChannels(data.channels ?? [])
    } catch (err) {
      setChannelsError(err instanceof Error ? err.message : 'Ошибка загрузки')
    } finally {
      setLoadingChannels(false)
    }
  }, [])

  useEffect(() => {
    if (activePl) loadChannels(activePl)
  }, [activePl, loadChannels])

  useEffect(() => {
    const video = videoRef.current
    if (!video || !activeChannel) return

    const url = activeChannel.url

    // Очищаем предыдущую сессию HLS
    hlsRef.current?.destroy()
    hlsRef.current = null

    const isHls = /\.m3u8/i.test(url) || url.includes('hls')

    if (isHls) {
      // Динамический импорт — hls.js большой, грузим только когда нужен
      import('hls.js').then(({ default: Hls }) => {
        if (!Hls.isSupported()) {
          // Safari поддерживает HLS нативно
          video.src = url
          video.play().catch(() => null)
          return
        }
        const hls = new Hls({ enableWorker: false })
        hls.loadSource(url)
        hls.attachMedia(video)
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => null) })
        hlsRef.current = hls
      })
    } else {
      video.src = url
      video.play().catch(() => null)
    }

    return () => {
      hlsRef.current?.destroy()
      hlsRef.current = null
    }
  }, [activeChannel])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch('/api/iptv', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      if (!res.ok) return
      onDelete(id)
      if (activePl?.id === id) {
        // playlists prop ещё не обновился — берём следующий из текущего списка
        const remaining = playlists.filter((p) => p.id !== id)
        setActivePl(remaining[0] ?? null)
        setChannels([])
        setActiveChannel(null)
      }
    } finally {
      setDeleting(null)
    }
  }

  const filtered = query
    ? channels.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()))
    : channels

  const groups = [...new Set(filtered.map((c) => c.group ?? '').filter(Boolean))]

  if (playlists.length === 0) return null

  return (
    <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
      {/* Шапка плеера */}
      <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
        <Tv className="size-4 shrink-0 text-primary" />
        <p className="text-sm font-semibold">IPTV-плеер</p>
        {activePl && (
          <span className="ml-auto truncate text-xs text-muted-foreground">{activePl.name}</span>
        )}
      </div>

      <div className="flex flex-col lg:flex-row">
        {/* Боковой список каналов / плейлистов */}
        <div
          className={`flex flex-col border-border lg:w-64 lg:shrink-0 lg:border-r ${showList ? '' : 'hidden lg:flex'}`}
        >
          {/* Переключатель плейлистов (если > 1) */}
          {playlists.length > 1 && (
            <div className="border-b border-border p-2">
              <select
                value={activePl?.id ?? ''}
                onChange={(e) => {
                  const pl = playlists.find((p) => p.id === e.target.value) ?? null
                  setActivePl(pl)
                }}
                className="w-full rounded-lg border border-border bg-background px-2 py-1.5 text-sm outline-none focus:border-primary/50"
              >
                {playlists.map((pl) => (
                  <option key={pl.id} value={pl.id}>{pl.name}</option>
                ))}
              </select>
            </div>
          )}

          {/* Поиск */}
          <div className="relative border-b border-border">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Поиск каналов..."
              className="w-full bg-transparent py-2.5 pl-8 pr-3 text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>

          {/* Список */}
          <div className="h-64 overflow-y-auto lg:h-[420px]">
            {loadingChannels && (
              <div className="flex h-20 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="size-4 animate-spin" />
                Загрузка...
              </div>
            )}
            {channelsError && (
              <div className="flex h-20 flex-col items-center justify-center gap-1 px-4 text-center">
                <AlertCircle className="size-5 text-destructive" />
                <p className="text-xs text-muted-foreground">{channelsError}</p>
              </div>
            )}
            {!loadingChannels && !channelsError && filtered.length === 0 && (
              <p className="p-4 text-center text-xs text-muted-foreground">Каналы не найдены</p>
            )}
            {!loadingChannels && !channelsError && (
              groups.length > 0 ? (
                groups.map((group) => (
                  <div key={group}>
                    <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                      {group}
                    </p>
                    {filtered.filter((c) => (c.group ?? '') === group).map((ch) => (
                      <ChannelRow
                        key={ch.url}
                        channel={ch}
                        active={activeChannel?.url === ch.url}
                        onSelect={() => { setActiveChannel(ch); setShowList(false) }}
                      />
                    ))}
                  </div>
                ))
              ) : (
                filtered.map((ch) => (
                  <ChannelRow
                    key={ch.url}
                    channel={ch}
                    active={activeChannel?.url === ch.url}
                    onSelect={() => { setActiveChannel(ch); setShowList(false) }}
                  />
                ))
              )
            )}
          </div>

          {/* Удаление плейлиста */}
          {activePl && (
            <div className="border-t border-border p-2">
              <button
                onClick={() => handleDelete(activePl.id)}
                disabled={deleting === activePl.id}
                className="w-full rounded-lg py-1.5 text-xs text-destructive/70 transition-colors hover:bg-destructive/10 hover:text-destructive disabled:opacity-40"
              >
                {deleting === activePl.id ? 'Удаление...' : 'Удалить плейлист'}
              </button>
            </div>
          )}
        </div>

        {/* Область видео */}
        <div className="flex flex-1 flex-col">
          {activeChannel && !showList && (
            <button
              onClick={() => setShowList(true)}
              className="flex items-center gap-1.5 border-b border-border px-4 py-2 text-xs text-muted-foreground transition-colors hover:text-foreground lg:hidden"
            >
              <ChevronLeft className="size-3.5" />
              Список каналов
            </button>
          )}

          {activeChannel ? (
            <div className="bg-black">
              <video
                ref={videoRef}
                controls
                playsInline
                className="w-full"
                style={{ maxHeight: '420px' }}
              />
              <p className="px-3 py-2 text-xs text-white/60">{activeChannel.name}</p>
            </div>
          ) : (
            <div className="flex h-64 flex-col items-center justify-center gap-2 text-muted-foreground lg:h-[420px]">
              <Tv className="size-10 opacity-20" />
              <p className="text-sm">Выберите канал</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ChannelRow({
  channel,
  active,
  onSelect,
}: {
  channel: M3uChannel
  active: boolean
  onSelect: () => void
}) {
  return (
    <button
      onClick={onSelect}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-muted ${
        active ? 'bg-primary/10 font-semibold text-primary' : 'text-foreground'
      }`}
    >
      {channel.logo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={channel.logo}
          alt=""
          className="size-6 shrink-0 rounded object-contain"
          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="size-6 shrink-0 rounded bg-muted" />
      )}
      <span className="truncate">{channel.name}</span>
    </button>
  )
}
