import { NextResponse } from 'next/server'
import { searchMovies, getMovieWatchProviders } from '@/lib/tmdb'

export const runtime = 'nodejs'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

const SYSTEM_PROMPT = `Ты — эксперт по кино с энциклопедическими знаниями всех фильмов.
Пользователь пытается вспомнить фильм по расплывчатому описанию.
Идентифицируй наиболее вероятный фильм.

Верни ТОЛЬКО валидный JSON без markdown, без пояснений:
{
  "candidates": [
    {
      "title": "string (original English title)",
      "title_ru": "string (Russian title if known, otherwise empty string)",
      "year": number,
      "confidence": number,
      "reasoning": "string (1-2 предложения на русском языке)"
    }
  ],
  "uncertain": boolean
}

Правила:
- До 3 кандидатов, отсортированных по confidence DESC
- Включать только candidates с confidence > 0.3
- title ВСЕГДА на английском (для поиска в TMDB)
- title_ru — русское прокатное название если знаешь, иначе ""
- confidence: 1.0 = абсолютно уверен, 0.5 = вероятно, 0.3 = возможно
- Если совсем не понял → uncertain: true, candidates: []
- reasoning на русском языке`

export interface DetectiveCandidate {
  title: string
  title_ru: string
  year: number
  confidence: number
  reasoning: string
  tmdb_id: number | null
  poster_path: string | null
  vote_average: number | null
  genres: { id: number; name: string }[]
  providers_ru: string[]
  overview: string | null
}

export interface FilmDetectiveResponse {
  candidates: DetectiveCandidate[]
  uncertain: boolean
}

interface GroqCandidate {
  title: string
  title_ru: string
  year: number
  confidence: number
  reasoning: string
}

interface GroqResult {
  candidates: GroqCandidate[]
  uncertain: boolean
}

export async function POST(req: Request) {
  let description: string
  try {
    const body = await req.json()
    description = String(body?.description ?? '').trim()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (description.length < 5) {
    return NextResponse.json({ error: 'Слишком короткое описание' }, { status: 400 })
  }
  if (description.length > 800) {
    return NextResponse.json({ error: 'Описание слишком длинное' }, { status: 400 })
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'AI недоступен' }, { status: 503 })
  }

  let groqResult: GroqResult
  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.3,
        max_tokens: 600,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: `Помоги найти фильм по описанию: "${description}"` },
        ],
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) {
      return NextResponse.json({ error: 'AI ошибка' }, { status: 502 })
    }

    const groqData = await groqRes.json()
    const content = groqData.choices?.[0]?.message?.content ?? '{}'
    groqResult = JSON.parse(content) as GroqResult
  } catch {
    return NextResponse.json({ error: 'AI ошибка разбора' }, { status: 502 })
  }

  const rawCandidates: GroqCandidate[] = Array.isArray(groqResult.candidates)
    ? groqResult.candidates.filter((c) => c.confidence > 0.3).slice(0, 3)
    : []

  const enriched = await Promise.all(
    rawCandidates.map(async (c): Promise<DetectiveCandidate> => {
      try {
        const results = await searchMovies(c.title)
        const movie = results.results?.[0]

        if (!movie) {
          return {
            ...c,
            tmdb_id: null,
            poster_path: null,
            vote_average: null,
            genres: [],
            providers_ru: [],
            overview: null,
          }
        }

        const yearMatch = movie.release_date
          ? Math.abs(Number(movie.release_date.slice(0, 4)) - c.year) <= 2
          : false
        const adjustedConfidence = yearMatch
          ? Math.min(1, c.confidence + 0.1)
          : c.confidence

        const providers = await getMovieWatchProviders(movie.id).catch(() => null)
        const ruProviders = providers?.results?.RU
        const providerNames = [
          ...(ruProviders?.flatrate?.map((p: { provider_name: string }) => p.provider_name) ?? []),
          ...(ruProviders?.rent?.map((p: { provider_name: string }) => p.provider_name) ?? []),
        ].slice(0, 3)

        return {
          title: c.title,
          title_ru: c.title_ru,
          year: c.year,
          confidence: adjustedConfidence,
          reasoning: c.reasoning,
          tmdb_id: movie.id,
          poster_path: movie.poster_path,
          vote_average: movie.vote_average,
          genres: [],
          providers_ru: providerNames,
          overview: movie.overview ?? null,
        }
      } catch {
        return {
          ...c,
          tmdb_id: null,
          poster_path: null,
          vote_average: null,
          genres: [],
          providers_ru: [],
          overview: null,
        }
      }
    })
  )

  enriched.sort((a, b) => b.confidence - a.confidence)

  return NextResponse.json({
    candidates: enriched,
    uncertain: Boolean(groqResult.uncertain),
  } satisfies FilmDetectiveResponse)
}
