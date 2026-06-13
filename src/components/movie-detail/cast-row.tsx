import Image from 'next/image'
import type { TMDBCast } from '@/types/tmdb'

const PROFILE_BASE = 'https://image.tmdb.org/t/p/w185'

interface CastRowProps {
  cast: TMDBCast[]
}

export function CastRow({ cast }: CastRowProps) {
  const top = cast.slice(0, 5)
  if (top.length === 0) return null

  return (
    <div>
      <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        В ролях
      </p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {top.map((actor) => (
          <div key={actor.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <div className="relative size-14 overflow-hidden rounded-full bg-muted">
              {actor.profile_path ? (
                <Image
                  src={`${PROFILE_BASE}${actor.profile_path}`}
                  alt={actor.name}
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center text-lg text-muted-foreground">
                  ?
                </div>
              )}
            </div>
            <p className="text-center text-[10px] font-medium leading-tight line-clamp-2">
              {actor.name}
            </p>
            <p className="text-center text-[10px] text-muted-foreground leading-tight line-clamp-2">
              {actor.character}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
