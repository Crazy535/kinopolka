import { auth } from '@/auth'
import { NextResponse } from 'next/server'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI service unavailable' }, { status: 503 })
  }

  let body: { title: string; year?: string; genres?: string[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  const { title, year, genres = [] } = body
  if (!title) return NextResponse.json({ error: 'Missing title' }, { status: 400 })

  const genreCtx = genres.length > 0 ? ` Жанры: ${genres.join(', ')}.` : ''
  const yearCtx = year ? ` (${year})` : ''

  const prompt = `Напиши 1-2 предложения на русском языке — почему фильм/сериал "${title}"${yearCtx} стоит посмотреть.${genreCtx} Будь конкретным, коротким, без спойлеров.`

  try {
    const res = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 150,
      }),
    })

    if (!res.ok) {
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const data = (await res.json()) as {
      choices: Array<{ message: { content: string } }>
    }
    const explanation = data.choices[0]?.message?.content?.trim() ?? ''
    return NextResponse.json({ explanation })
  } catch {
    return NextResponse.json({ error: 'AI service error' }, { status: 502 })
  }
}
