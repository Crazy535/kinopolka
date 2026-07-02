import { NextResponse } from 'next/server'
import { getPersonCombinedCredits, getMovieDetails, getMovieWatchProviders } from '@/lib/tmdb'
import { withTmdbCache } from '@/lib/tmdb-cache'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'

export const runtime = 'nodejs'

type RuntimeGroup = 'short' | 'medium' | 'long'

export interface EveningFilm {
  id: number
  title: string
  poster_path: string
  vote_average: number
  vote_count: number
  runtime: number | null
  runtime_group: RuntimeGroup | null
  genres: { id: number; name: string }[]
  providers_ru: string[]
  release_date: string
}

export interface EveningWithResponse {
  person_name?: string
  films: EveningFilm[]
  grouped: { short: EveningFilm[]; medium: EveningFilm[]; long: EveningFilm[]; unknown: EveningFilm[] }
}

function runtimeGroup(minutes: number | null): RuntimeGroup | null {
  if (minutes === null || minutes <= 0) return null
  if (minutes <= 90) return 'short'
  if (minutes <= 150) return 'medium'
  return 'long'
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const rl = await checkRateLimit(`evening:${getClientIp(req)}`)
  if (!rl.success) return rateLimitResponse(rl)

  const { id } = await params
  const personId = Number(id)
  if (!personId || isNaN(personId)) {
    return NextResponse.json({ error: 'Invalid person id' }, { status: 400 })
  }

  try {
    const credits = await withTmdbCache(
      `person-credits-${personId}`,
      () => getPersonCombinedCredits(personId),
      3600
    )

    const allWork = [...credits.cast, ...credits.crew]
    const seen = new Set<number>()
    const candidates = allWork
      .filter((c) => {
        if (c.media_type !== 'movie') return false
        if (!c.poster_path) return false
        if (c.vote_average < 6.0) return false
        if (c.vote_count < 100) return false
        if (seen.has(c.id)) return false
        seen.add(c.id)
        return true
      })
      .sort(
        (a, b) =>
          b.vote_average * Math.log(b.vote_count + 1) -
          a.vote_average * Math.log(a.vote_count + 1)
      )
      .slice(0, 15)

    const enriched = await Promise.all(
      candidates.map(async (c): Promise<EveningFilm> => {
        const [details, providers] = await Promise.all([
          withTmdbCache(`movie-details-${c.id}`, () => getMovieDetails(c.id), 86400),
          withTmdbCache(
            `movie-providers-ru-${c.id}`,
            () => getMovieWatchProviders(c.id),
            86400
          ),
        ])

        const ruProviders = providers?.results?.RU
        const providerNames = [
          ...(ruProviders?.flatrate?.map((p: { provider_name: string }) => p.provider_name) ?? []),
          ...(ruProviders?.rent?.map((p: { provider_name: string }) => p.provider_name) ?? []),
        ].slice(0, 3)

        const rt = details.runtime ?? null

        return {
          id: c.id,
          title: c.title ?? c.name ?? '',
          poster_path: c.poster_path!,
          vote_average: details.vote_average ?? c.vote_average,
          vote_count: details.vote_count ?? c.vote_count,
          runtime: rt,
          runtime_group: runtimeGroup(rt),
          genres: details.genres ?? [],
          providers_ru: providerNames,
          release_date: c.release_date ?? '',
        }
      })
    )

    const grouped = {
      short: enriched.filter((f) => f.runtime_group === 'short'),
      medium: enriched.filter((f) => f.runtime_group === 'medium'),
      long: enriched.filter((f) => f.runtime_group === 'long'),
      unknown: enriched.filter((f) => f.runtime_group === null),
    }

    return NextResponse.json({ films: enriched, grouped } satisfies EveningWithResponse)
  } catch (err) {
    console.error('[evening-with]', err)
    return NextResponse.json({ error: 'Failed to fetch films' }, { status: 500 })
  }
}
