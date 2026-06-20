import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { randomUUID, randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'
import { grantReferralAchievements } from '@/lib/achievements'

function generateReferralCode(): string {
  return randomBytes(4).toString('hex') // 8-char hex code
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, name, referralCode } = await request.json()

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

    await prisma.user.create({
      data: {
        email,
        name: name || null,
        passwordHash,
        referralCode: newReferralCode,
        referredById: referrer?.id ?? null,
      },
    })

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
