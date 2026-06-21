import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Puzzle } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { PLUGINS } from '@/lib/plugins/registry'
import { PluginCard } from '@/components/profile/plugin-card'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Плагины — Кинополка',
  description: 'Дополнительные модули: IPTV-плеер и другие. Включайте то, что нужно вам.',
}

export default async function PluginsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const rows = await prisma.userPlugin.findMany({
    where: { userId: session.user.id },
    select: { pluginId: true, enabled: true },
  })
  const enabledMap = new Map(rows.map((r) => [r.pluginId, r.enabled]))

  return (
    <div className="pb-12">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Профиль
      </Link>

      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Puzzle className="size-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Плагины</h1>
          <p className="mt-1 max-w-prose text-sm text-muted-foreground">
            Дополнительные модули Кинополки. Все плагины — наши, встроены в приложение; ничего
            стороннего не скачивается и не исполняется.
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {PLUGINS.map((plugin) => (
          <PluginCard
            key={plugin.id}
            plugin={plugin}
            initialEnabled={enabledMap.get(plugin.id) ?? false}
          />
        ))}
      </div>
    </div>
  )
}
