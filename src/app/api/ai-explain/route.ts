import { auth } from '@/auth'
import { checkRateLimit } from '@/lib/rate-limit'
import { chatCompletion } from '@/lib/ai-provider'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const session = await auth()
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    req.headers.get('x-real-ip') ??
    session?.user?.id ??
    'anon'
  const rl = await checkRateLimit(`explain:${ip}`)
  if (!rl.success) {
    return NextResponse.json(
      { error: 'Too many requests. Try again in a minute.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil((rl.reset - Date.now()) / 1000)),
          'X-RateLimit-Remaining': String(rl.remaining),
        },
      }
    )
  }

  let body: {
    title: string
    year?: string
    genres?: string[]
    director?: string
    cast?: string[]
    overview?: string
  }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { title, year, genres = [], director, cast = [], overview } = body
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  const yearCtx = year ? ` (${year})` : ''
  const directorCtx = director ? ` Режиссёр: ${director}.` : ''
  const castCtx = cast.length > 0 ? ` В ролях: ${cast.slice(0, 3).join(', ')}.` : ''
  const genreCtx = genres.length > 0 ? ` Жанры: ${genres.join(', ')}.` : ''
  const overviewCtx = overview ? ` Контекст: ${overview.slice(0, 100)}.` : ''

  const prompt = `Напиши одну цепляющую фразу на русском — что делает "${title}"${yearCtx} особенным. Не используй слова "стоит посмотреть", "обязательно к просмотру", "рекомендуем". Используй конкретную деталь.${directorCtx}${castCtx}${genreCtx}${overviewCtx} Без спойлеров. Только одна фраза.`

  try {
    const explanation = await chatCompletion({
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.85,
      max_tokens: 120,
    })
    return NextResponse.json({ explanation: explanation.trim() })
  } catch {
    return NextResponse.json({ error: 'AI service error' }, { status: 502 })
  }
}
