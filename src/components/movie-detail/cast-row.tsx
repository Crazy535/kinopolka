import Image from 'next/image'
import Link from 'next/link'
import type { TMDBCast, TMDBCrew } from '@/types/tmdb'

const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'

interface CastRowProps {
  cast: TMDBCast[]
  crew?: TMDBCrew[]
}

function findDirector(crew: TMDBCrew[]): TMDBCrew | undefined {
  return crew.find((c) => c.job === 'Director')
}

export function CastRow({ cast, crew = [] }: CastRowProps) {
  const top = cast.slice(0, 8)
  const director = findDirector(crew)
  if (top.length === 0) return null

  return (
    <div className="flex flex-col gap-5">
      {director && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Режиссёр
          </p>
          <Link
            href={`/person/${director.id}`}
            className="group inline-flex items-center gap-2.5"
          >
            <div className="relative size-9 overflow-hidden rounded-full bg-muted ring-2 ring-transparent transition-all duration-200 group-hover:ring-primary/50">
              {director.profile_path ? (
                <Image
                  src={`${PROFILE_BASE}${director.profile_path}`}
                  alt={director.name}
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-xs text-muted-foreground">
                  ?
                </div>
              )}
            </div>
            <span className="text-sm font-medium transition-colors group-hover:text-primary">
              {director.name}
            </span>
          </Link>
        </div>
      )}

      <div>
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          В ролях
        </p>
        <div className="flex gap-4 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          {top.map((actor) => (
            <Link
              key={actor.id}
              href={`/person/${actor.id}`}
              className="group flex w-[88px] shrink-0 flex-col items-center gap-1.5"
            >
              <div className="relative size-[88px] overflow-hidden rounded-full bg-muted ring-2 ring-transparent transition-all duration-200 group-hover:ring-primary/50">
                {actor.profile_path ? (
                  <Image
                    src={`${PROFILE_BASE}${actor.profile_path}`}
                    alt={actor.name}
                    fill
                    sizes="88px"
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-lg text-muted-foreground">
                    ?
                  </div>
                )}
              </div>
              <p className="text-center text-[11px] font-medium leading-tight line-clamp-2 transition-colors group-hover:text-primary">
                {actor.name}
              </p>
              <p className="text-center text-[11px] leading-tight text-muted-foreground line-clamp-2">
                {actor.character}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
