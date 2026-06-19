import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  let body: { email?: unknown; token?: unknown; password?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
  const token = typeof body.token === 'string' ? body.token.trim() : ''
  const password = typeof body.password === 'string' ? body.password : ''

  if (!email || !token || password.length < 8) {
    return NextResponse.json(
      { error: 'Email, token and password (min 8 chars) are required' },
      { status: 400 }
    )
  }

  const record = await prisma.passwordResetToken.findUnique({ where: { token } })

  if (!record || record.email !== email || record.expires < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })
  }

  const passwordHash = await bcrypt.hash(password, 12)

  await prisma.$transaction([
    prisma.user.update({ where: { email }, data: { passwordHash } }),
    prisma.passwordResetToken.delete({ where: { token } }),
  ])

  return NextResponse.json({ ok: true })
}
