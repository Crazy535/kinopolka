import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')
  const email = searchParams.get('email')

  if (!token || !email) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url))
  }

  const record = await prisma.verificationToken.findUnique({
    where: { identifier_token: { identifier: email, token } },
  })

  if (!record) {
    return NextResponse.redirect(new URL('/verify-email?error=invalid', request.url))
  }

  if (record.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { identifier_token: { identifier: email, token } },
    })
    return NextResponse.redirect(new URL('/verify-email?error=expired', request.url))
  }

  await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  })

  await prisma.verificationToken.delete({
    where: { identifier_token: { identifier: email, token } },
  })

  return NextResponse.redirect(new URL('/login?verified=1', request.url))
}
