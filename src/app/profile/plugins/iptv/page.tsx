'use client'

import Link from 'next/link'
import { ArrowLeft, Tv } from 'lucide-react'
import { useState, useEffect } from 'react'
import { AddPlaylistForm } from '@/components/profile/iptv/add-playlist-form'
import { IptvPlayer } from '@/components/profile/iptv/iptv-player'

interface Playlist {
  id: string
  name: string
  sourceType: string
  sourceUrl: string | null
  createdAt: string
}

// Эта страница — клиентская: загружаем плейлисты через fetch на клиенте,
// чтобы не дублировать серверный fetch при добавлении/удалении.
export default function IptvPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([])
  const [loading, setLoading] = useState(true)
  const [pluginEnabled, setPluginEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    async function init() {
      const [plRes, plgRes] = await Promise.all([
        fetch('/api/iptv'),
        fetch('/api/plugins'),
      ])

      if (plRes.status === 401 || plgRes.status === 401) {
        // auth redirect в клиентском компоненте
        window.location.href = '/'
        return
      }

      const plgData = await plgRes.json().catch(() => ({ enabled: {} }))
      setPluginEnabled(Boolean(plgData.enabled?.iptv))

      const plData = await plRes.json().catch(() => ({ playlists: [] }))
      setPlaylists(plData.playlists ?? [])
      setLoading(false)
    }
    init()
  }, [])

  if (loading) {
    return (
      <div className="pb-12">
        <Link href="/profile/plugins" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Плагины
        </Link>
        <div className="mt-16 flex justify-center">
          <div className="size-6 animate-spin rounded-full border-2 border-border border-t-primary" />
        </div>
      </div>
    )
  }

  if (!pluginEnabled) {
    return (
      <div className="pb-12">
        <Link href="/profile/plugins" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" />
          Плагины
        </Link>
        <div className="mt-12 flex flex-col items-center gap-4 text-center">
          <Tv className="size-12 text-muted-foreground/30" />
          <p className="font-semibold">Плагин IPTV не включён</p>
          <p className="max-w-xs text-sm text-muted-foreground">
            Перейдите в раздел «Плагины» и включите тумблер IPTV-плеера.
          </p>
          <Link
            href="/profile/plugins"
            className="rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Открыть Плагины
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-12">
      <Link href="/profile/plugins" className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <ArrowLeft className="size-4" />
        Плагины
      </Link>

      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Tv className="size-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] sm:text-3xl">IPTV-плеер</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Ваши личные M3U-плейлисты. Используйте только собственные плейлисты и
            контент, на который у вас есть право.
          </p>
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <AddPlaylistForm
          onAdded={(pl) => setPlaylists((prev) => [pl as Playlist, ...prev])}
        />
      </div>

      {playlists.length > 0 ? (
        <IptvPlayer
          playlists={playlists}
          onDelete={(id) => setPlaylists((prev) => prev.filter((p) => p.id !== id))}
        />
      ) : (
        <div className="mt-8 flex flex-col items-center gap-3 text-center text-muted-foreground">
          <Tv className="size-10 opacity-20" />
          <p className="text-sm">Нет плейлистов. Добавьте первый выше.</p>
        </div>
      )}
    </div>
  )
}
