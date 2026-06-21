'use client'

import { useState } from 'react'
import { Link2, Upload, X, Plus } from 'lucide-react'

interface Props {
  onAdded: (playlist: { id: string; name: string; sourceType: string; sourceUrl: string | null }) => void
}

export function AddPlaylistForm({ onAdded }: Props) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<'url' | 'file'>('url')
  const [name, setName] = useState('')
  const [url, setUrl] = useState('')
  const [rawContent, setRawContent] = useState('')
  const [fileName, setFileName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setName('')
    setUrl('')
    setRawContent('')
    setFileName('')
    setError('')
  }

  function close() {
    setOpen(false)
    reset()
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) {
      setError('Файл слишком большой (макс. 10 МБ)')
      return
    }
    const text = await file.text()
    setRawContent(text)
    setFileName(file.name)
    if (!name) setName(file.name.replace(/\.m3u8?$/i, ''))
  }

  async function handleSubmit() {
    if (loading) return
    if (!name.trim()) { setError('Введите название'); return }
    if (mode === 'url' && !url.trim()) { setError('Введите URL'); return }
    if (mode === 'file' && !rawContent) { setError('Выберите файл'); return }

    setLoading(true)
    setError('')

    try {
      const body =
        mode === 'url'
          ? { name: name.trim(), sourceType: 'url', sourceUrl: url.trim() }
          : { name: name.trim(), sourceType: 'file', rawContent }

      const res = await fetch('/api/iptv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error ?? 'Ошибка создания')
      }

      const data = await res.json()
      onAdded(data.playlist)
      close()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка создания')
    } finally {
      setLoading(false)
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-xl border border-dashed border-border px-4 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Plus className="size-4" />
        Добавить плейлист
      </button>
    )
  }

  return (
    <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold">Новый плейлист</p>
        <button onClick={close} className="text-muted-foreground hover:text-foreground">
          <X className="size-4" />
        </button>
      </div>

      {/* Переключатель режима */}
      <div className="mb-4 flex rounded-lg border border-border overflow-hidden text-sm">
        <button
          type="button"
          onClick={() => { setMode('url'); reset() }}
          className={`flex flex-1 items-center justify-center gap-2 py-2 transition-colors ${mode === 'url' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Link2 className="size-4" />
          По URL
        </button>
        <button
          type="button"
          onClick={() => { setMode('file'); reset() }}
          className={`flex flex-1 items-center justify-center gap-2 py-2 transition-colors ${mode === 'file' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
        >
          <Upload className="size-4" />
          Файл .m3u
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Название плейлиста"
          maxLength={200}
          autoFocus
          className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
        />

        {mode === 'url' ? (
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/playlist.m3u"
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none placeholder:text-muted-foreground focus:border-primary/50"
          />
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-border bg-background p-4 text-sm text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground">
            <Upload className="mb-1.5 size-5" />
            {fileName ? (
              <span className="font-medium text-foreground">{fileName}</span>
            ) : (
              <span>Нажмите для выбора файла .m3u / .m3u8</span>
            )}
            <input
              type="file"
              accept=".m3u,.m3u8,text/plain"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        )}

        {error && <p className="text-xs text-destructive">{error}</p>}

        <p className="text-[11px] text-muted-foreground">
          Используйте только свои плейлисты. Вы несёте ответственность за законность контента.
        </p>

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 rounded-lg bg-primary py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            {loading ? 'Добавление...' : 'Добавить'}
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-lg border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  )
}
