import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const email = searchParams.get('email')
  const token = searchParams.get('token')

  if (!email || !token) {
    return new NextResponse('Недействительная ссылка для отписки.', { status: 400 })
  }

  // Verify token: SHA-256(email + UNSUBSCRIBE_SECRET)
  const secret = process.env.UNSUBSCRIBE_SECRET ?? process.env.AUTH_SECRET ?? ''
  const expected = await computeToken(email, secret)

  if (token !== expected) {
    return new NextResponse('Недействительный токен.', { status: 403 })
  }

  await prisma.user.updateMany({
    where: { email },
    data: { emailUnsubscribed: true },
  })

  return new NextResponse(
    `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Отписка — Кинополка</title>
  <style>
    /* Standalone HTML вне React — токены дизайн-системы недоступны, цвета
       вручную повторяют globals.css (background/foreground/primary). */
    body { font-family: sans-serif; background: #0A0B14; color: #F5F3EF; display: flex; align-items: center; justify-content: center; min-height: 100dvh; margin: 0; }
    .card { background: #12131F; border-radius: 16px; padding: 48px 40px; max-width: 420px; text-align: center; }
    h1 { font-size: 24px; margin: 0 0 12px; }
    p { color: #9B9BAD; font-size: 15px; line-height: 1.6; margin: 0 0 28px; }
    a { display: inline-block; background: #C41E3A; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Вы отписаны</h1>
    <p>Вы больше не будете получать email-рассылку от Кинополки. Вы всегда можете снова подписаться в настройках профиля.</p>
    <a href="https://kinopolka.vercel.app">На главную</a>
  </div>
</body>
</html>`,
    {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }
  )
}

async function computeToken(email: string, secret: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(email + secret)
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, data)
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}
