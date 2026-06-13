import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, name } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Пароль должен быть не менее 8 символов' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email уже занят' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.create({
      data: { email, name: name || null, passwordHash },
    })

    const token = randomUUID()
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000)
    await prisma.verificationToken.create({
      data: { identifier: email, token, expires },
    })

    const baseUrl = new URL(request.url).origin
    try {
      await sendVerificationEmail(email, token, baseUrl)
    } catch (emailErr) {
      console.error('[register] email send failed:', emailErr)
    }

    return NextResponse.json({ success: true }, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[register] handler error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
