import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { getPlugin, isValidPluginId } from '@/lib/plugins/registry'

export const dynamic = 'force-dynamic'

// GET — состояние плагинов пользователя: { [pluginId]: boolean }
export async function GET() {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const rows = await prisma.userPlugin.findMany({
    where: { userId: session.user.id },
    select: { pluginId: true, enabled: true },
  })

  const enabled: Record<string, boolean> = {}
  for (const row of rows) enabled[row.pluginId] = row.enabled

  return NextResponse.json({ enabled })
}

// POST — переключить плагин { pluginId, enabled }
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const pluginId = String(body.pluginId ?? '')
  const enabled = Boolean(body.enabled)

  if (!isValidPluginId(pluginId)) {
    return NextResponse.json({ error: 'Unknown plugin' }, { status: 400 })
  }

  const plugin = getPlugin(pluginId)!
  // Заглушки (status: 'soon') нельзя включать — у них нет рабочего UI.
  if (enabled && plugin.status === 'soon') {
    return NextResponse.json({ error: 'Plugin not available yet' }, { status: 409 })
  }

  await prisma.userPlugin.upsert({
    where: { userId_pluginId: { userId: session.user.id, pluginId } },
    create: { userId: session.user.id, pluginId, enabled },
    update: { enabled },
  })

  return NextResponse.json({ pluginId, enabled })
}
