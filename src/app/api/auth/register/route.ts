import { NextRequest, NextResponse } from 'next/server'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { randomUUID, randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { grantReferralAchievements } from '@/lib/achievements'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

function generateReferralCode(): string {
  return randomBytes(4).toString('hex') // 8-char hex code
}

// Простая проверка формата email (защита от явно битых значений).
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(request: NextRequest) {
  const rl = await checkRateLimit(`register:${getClientIp(request)}`)
  if (!rl.success) return rateLimitResponse(rl)

  try {
    const { email, password, name, referralCode } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 })
    }

    if (typeof email !== 'string' || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: 'Некорректный email' }, { status: 400 })
    }

    if (typeof password !== 'string' || password.length < 8) {
      return NextResponse.json({ error: 'Пароль должен быть не менее 8 символов' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Email уже занят' }, { status: 409 })
    }

    // Validate referral code if provided
    let referrer: { id: string } | null = null
    if (referralCode && typeof referralCode === 'string') {
      referrer = await prisma.user.findUnique({
        where: { referralCode: referralCode.toLowerCase().trim() },
        select: { id: true },
      })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const newReferralCode = generateReferralCode()

    try {
      await prisma.user.create({
        data: {
          email,
          name: name || null,
          passwordHash,
          referralCode: newReferralCode,
          referredById: referrer?.id ?? null,
        },
      })
    } catch (createErr) {
      // Гонка findUnique→create: параллельный запрос уже занял email.
      if (
        createErr instanceof Prisma.PrismaClientKnownRequestError &&
        createErr.code === 'P2002'
      ) {
        return NextResponse.json({ error: 'Email уже занят' }, { status: 409 })
      }
      throw createErr
    }

    // Grant XP/badges to referrer asynchronously (don't block registration)
    if (referrer) {
      grantReferralAchievements(referrer.id).catch((err) =>
        console.error('[register] referral achievements error:', err)
      )
    }

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
    console.error('[register] handler error:', err)
    return NextResponse.json({ error: 'Ошибка сервера. Попробуйте позже.' }, { status: 500 })
  }
}
