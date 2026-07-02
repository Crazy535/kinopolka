import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { randomBytes } from 'crypto'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export async function POST(req: NextRequest) {
  const rl = await checkRateLimit(`forgot:${getClientIp(req)}`)
  if (!rl.success) return rateLimitResponse(rl)

  let body: { email?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.toLowerCase().trim() : ''
  if (!email || !email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400 })
  }

  const user = await prisma.user.findUnique({ where: { email } })
  // Always respond with success to prevent user enumeration
  if (!user || !user.passwordHash) {
    return NextResponse.json({ ok: true })
  }

  // Delete any existing token for this email
  await prisma.passwordResetToken.deleteMany({ where: { email } })

  const token = randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  await prisma.passwordResetToken.create({
    data: { email, token, expires },
  })

  const baseUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    (req.headers.get('origin') || 'https://kinopolka.vercel.app')

  await sendPasswordResetEmail(email, token, baseUrl)

  return NextResponse.json({ ok: true })
}
