import Image from 'next/image'
import { User } from 'lucide-react'
import { MOVIE_GENRES } from '@/lib/tmdb-genres'
import type { BadgeId } from '@/lib/achievements'
import { BADGES } from '@/lib/achievements'

interface Props {
  name: string | null
  image: string | null
  level: number
  xp: number
  genreIds: number[]
  badgeIds: BadgeId[]
}

export function PublicProfileCard({ name, image, level, xp, genreIds, badgeIds }: Props) {
  const topGenres = genreIds
    .slice(0, 3)
    .map((id) => MOVIE_GENRES[id])
    .filter(Boolean)

  const unlockedCount = badgeIds.length
  const totalBadges = BADGES.length

  return (
    <div className="mb-10 flex items-center gap-4 rounded-2xl border border-border bg-gradient-to-br from-primary/5 to-muted/40 p-5">
      <div className="relative size-14 shrink-0 overflow-hidden rounded-full bg-muted ring-2 ring-primary/30">
        {image ? (
          <Image
            src={image}
            alt={name ?? 'Аватар'}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center">
            <User className="size-6 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-heading text-xl font-bold tracking-tight truncate">
            {name ?? 'Пользователь'}
          </span>
          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-bold text-primary">
            Ур. {level}
          </span>
        </div>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>{xp} XP</span>
          {unlockedCount > 0 && (
            <span>{unlockedCount}/{totalBadges} достижений</span>
          )}
          {topGenres.length > 0 && (
            <span>{topGenres.join(' · ')}</span>
          )}
        </div>
      </div>
    </div>
  )
}
