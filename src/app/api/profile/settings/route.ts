import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const updates: Record<string, unknown> = {}

  if ('name' in body) {
    const name = typeof body.name === 'string' ? body.name.trim() : ''
    if (!name || name.length > 64) {
      return NextResponse.json({ error: 'Имя обязательно (макс. 64 символа)' }, { status: 400 })
    }
    updates.name = name
  }

  if ('emailUnsubscribed' in body) {
    updates.emailUnsubscribed = Boolean(body.emailUnsubscribed)
  }

  if ('currentPassword' in body || 'newPassword' in body) {
    const currentPassword = typeof body.currentPassword === 'string' ? body.currentPassword : ''
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : ''

    if (newPassword.length < 8) {
      return NextResponse.json({ error: 'Новый пароль — минимум 8 символов' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { passwordHash: true },
    })

    if (!user?.passwordHash) {
      return NextResponse.json(
        { error: 'Смена пароля доступна только для аккаунтов с email/паролем' },
        { status: 400 }
      )
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Текущий пароль неверный' }, { status: 400 })
    }

    updates.passwordHash = await bcrypt.hash(newPassword, 12)
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Нет данных для обновления' }, { status: 400 })
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: updates,
    select: { id: true, name: true, emailUnsubscribed: true },
  })

  return NextResponse.json({ ok: true, user: updated })
}
