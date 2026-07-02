'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Tv, Download, CalendarClock, ArrowRight, type LucideIcon } from 'lucide-react'
import type { Plugin, PluginIcon } from '@/lib/plugins/registry'

const ICONS: Record<PluginIcon, LucideIcon> = {
  Tv,
  Download,
  CalendarClock,
}

export function PluginCard({
  plugin,
  initialEnabled,
}: {
  plugin: Plugin
  initialEnabled: boolean
}) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const [loading, setLoading] = useState(false)
  const Icon = ICONS[plugin.icon]
  const isSoon = plugin.status === 'soon'

  async function toggle() {
    if (loading || isSoon) return
    const next = !enabled
    setEnabled(next) // оптимистично
    setLoading(true)
    try {
      const res = await fetch('/api/plugins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pluginId: plugin.id, enabled: next }),
      })
      if (!res.ok) throw new Error('toggle failed')
    } catch {
      setEnabled(!next) // откат
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/30">
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold tracking-tight">{plugin.name}</h3>
            {plugin.status === 'beta' && (
              <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[11px] font-bold uppercase text-gold">
                Beta
              </span>
            )}
            {isSoon && (
              <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold uppercase text-muted-foreground">
                Скоро
              </span>
            )}
          </div>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">{plugin.description}</p>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-border pt-3">
        {/* Toggle */}
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`${enabled ? 'Выключить' : 'Включить'} ${plugin.name}`}
          disabled={loading || isSoon}
          onClick={toggle}
          className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
            enabled ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <span
            className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
              enabled ? 'translate-x-[22px]' : 'translate-x-0.5'
            }`}
          />
        </button>

        {enabled && plugin.route ? (
          <Link
            href={plugin.route}
            className="flex items-center gap-1 text-sm font-medium text-primary transition-opacity hover:opacity-80"
          >
            Открыть
            <ArrowRight className="size-4" />
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">
            {isSoon ? 'В разработке' : enabled ? 'Включён' : 'Выключен'}
          </span>
        )}
      </div>
    </div>
  )
}
