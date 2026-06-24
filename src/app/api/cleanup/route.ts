import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()

  const [rooms, verTokens, resetTokens] = await Promise.all([
    prisma.partnerRoom.deleteMany({ where: { expiresAt: { lt: now } } }),
    prisma.verificationToken.deleteMany({ where: { expires: { lt: now } } }),
    prisma.passwordResetToken.deleteMany({ where: { expires: { lt: now } } }),
  ])

  return NextResponse.json({
    deleted: {
      partnerRooms: rooms.count,
      verificationTokens: verTokens.count,
      passwordResetTokens: resetTokens.count,
    },
  })
}
