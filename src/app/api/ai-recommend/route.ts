import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { calcMatchScore } from '@/lib/match-score'
import { MOVIE_GENRES, TV_GENRES } from '@/lib/tmdb-genres'
import { NextResponse } from 'next/server'
import type { TMDBMovie, TMDBTVShow } from '@/types/tmdb'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const MODEL = 'llama-3.3-70b-versatile'

type AISuggestion = {
  title: string
  year: number
  media_type: 'movie' | 'tv'
  reason: string
}

export type AiRecommendResult = {
  movie: TMDBMovie | TMDBTVShow
  reason: string
  media_type: 'movie' | 'tv'
  matchScore: number | null
}

function buildGenreContext(genreIds: number[]): string {
  const seen = new Set<number>()
  const names: string[] = []
  for (const id of genreIds) {
    if (seen.has(id)) continue
    seen.add(id)
    const name = MOVIE_GENRES[id] ?? TV_GENRES[id]
    if (name) names.push(name)
  }
  return names.length > 0 ? `User's preferred genres: ${names.join(', ')}.` : ''
}

function buildPersonContext(
  persons: { name: string; role: string }[]
): string {
  if (persons.length === 0) return ''
  const labelled = persons.map((p) =>
    p.role === 'director' ? `${p.name} (director)` : `${p.name} (actor)`
  )
  return `User loves the work of these people, prioritize their filmography when relevant: ${labelled.join(', ')}.`
}

const PERSON_STOP_WORDS = [
  'фильм',
  'фильмы',
  'кино',
  'сериал',
  'сериалы',
  'комедия',
  'комедии',
  'драма',
  'ужасы',
  'триллер',
  'детектив',
  'боевик',
  'мультфильм',
  'аниме',
  'что',
  'хочу',
  'movie',
  'film',
  'show',
  'series',
]

function looksLikePersonName(query: string): boolean {
  const words = query.trim().split(/\s+/)
  if (words.length < 1 || words.length > 3) return false
  const lower = query.toLowerCase()
  if (PERSON_STOP_WORDS.some((w) => lower.includes(w))) return false
  return words.every((w) => {
    const first = w.charAt(0)
    return first === first.toUpperCase() && first !== first.toLowerCase()
  })
}

async function searchTMDB(
  title: string,
  year: number,
  mediaType: 'movie' | 'tv'
): Promise<TMDBMovie | TMDBTVShow | null> {
  const token = process.env.TMDB_API_READ_TOKEN
  const endpoint = mediaType === 'movie' ? '/search/movie' : '/search/tv'
  const yearParam = mediaType === 'movie' ? 'year' : 'first_air_date_year'

  const url = new URL(`https://api.themoviedb.org/3${endpoint}`)
  url.searchParams.set('language', 'ru-RU')
  url.searchParams.set('query', title)
  url.searchParams.set(yearParam, String(year))
  url.searchParams.set('include_adult', 'false')

  const res = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 3600 },
  })
  if (!res.ok) return null

  const data = await res.json()
  return (data.results?.[0] as TMDBMovie | TMDBTVShow) ?? null
}

export async function POST(req: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const groqKey = process.env.GROQ_API_KEY
  if (!groqKey) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 503 })
  }

  let body: { query?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const query = typeof body.query === 'string' ? body.query.trim() : ''
  if (!query || query.length > 500) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 })
  }

  const [profile, favoritePersons] = await Promise.all([
    prisma.tasteProfile.findUnique({
      where: { userId: session.user.id },
      select: { genreIds: true },
    }),
    prisma.favoritePerson.findMany({
      where: { userId: session.user.id },
      select: { name: true, role: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  const genreContext = buildGenreContext(profile?.genreIds ?? [])
  const personContext = buildPersonContext(favoritePersons)
  const queryPersonContext = looksLikePersonName(query)
    ? `The user's request appears to be a person's name. Suggest films directed by or starring "${query}", drawing from their filmography.`
    : ''

  const systemPrompt = `You are a movie and TV show recommender for a Russian streaming service called Kinopolka. ${genreContext} ${personContext} ${queryPersonContext}
Based on the user's request, suggest exactly 6 movies or TV shows.
Respond ONLY with valid JSON in this exact format:
{"movies":[{"title":"English Original Title","year":2023,"media_type":"movie","reason":"Причина на русском"},{"title":"English Original Title","year":2020,"media_type":"tv","reason":"Причина на русском"}]}
Rules:
- title: use the ORIGINAL English title for accurate TMDB lookup
- year: integer release year
- media_type: "movie" or "tv" only
- reason: exactly 1 short sentence in Russian explaining why this fits the request
- Only suggest well-known titles you are confident exist
- Mix movies and TV shows when appropriate for the request`

  let suggestions: AISuggestion[] = []
  try {
    const groqRes = await fetch(GROQ_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${groqKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: query },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) {
      console.error('Groq API error:', groqRes.status, await groqRes.text())
      return NextResponse.json({ error: 'AI service error' }, { status: 502 })
    }

    const groqData = await groqRes.json()
    const content: string = groqData.choices?.[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(content)
    suggestions = Array.isArray(parsed.movies) ? parsed.movies.slice(0, 6) : []
  } catch (e) {
    console.error('Groq error:', e)
    return NextResponse.json({ error: 'Failed to generate recommendations' }, { status: 500 })
  }

  const userGenreIds = profile?.genreIds ?? []

  const enriched = await Promise.all(
    suggestions.map(async ({ title, year, media_type, reason }) => {
      try {
        const movie = await searchTMDB(title, year, media_type)
        if (!movie) return null
        const matchScore = calcMatchScore(movie.genre_ids ?? [], userGenreIds)
        return { movie, reason, media_type, matchScore } satisfies AiRecommendResult
      } catch {
        return null
      }
    })
  )

  const results = enriched.filter((r): r is AiRecommendResult => r !== null)
  return NextResponse.json({ results })
}
