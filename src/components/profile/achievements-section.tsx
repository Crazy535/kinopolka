import { Clapperboard, Trophy, Layers, Compass, Users, Lock } from 'lucide-react'
import { BADGES, type BadgeId } from '@/lib/achievements'

const BADGE_ICONS: Record<BadgeId, React.ReactNode> = {
  first_watch: <Clapperboard className="size-6" />,
  cinephile_10: <Trophy className="size-6" />,
  genre_master: <Layers className="size-6" />,
  explorer: <Compass className="size-6" />,
  partner: <Users className="size-6" />,
}

interface Props {
  unlockedIds: BadgeId[]
}

export function AchievementsSection({ unlockedIds }: Props) {
  const unlockedSet = new Set(unlockedIds)

  return (
    <div className="mb-10">
      <h2 className="mb-4 text-lg font-bold tracking-tight">Достижения</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {BADGES.map((badge) => {
          const unlocked = unlockedSet.has(badge.id)
          return (
            <div
              key={badge.id}
              title={unlocked ? badge.description : badge.condition}
              className={`relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-colors ${
                unlocked
                  ? 'border-primary/30 bg-primary/5'
                  : 'border-border bg-muted/40 opacity-60'
              }`}
            >
              <div
                className={`flex size-12 items-center justify-center rounded-full ${
                  unlocked ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'
                }`}
              >
                {unlocked ? BADGE_ICONS[badge.id] : <Lock className="size-5" />}
              </div>
              <div>
                <p className={`text-[13px] font-semibold leading-tight ${unlocked ? '' : 'text-muted-foreground'}`}>
                  {badge.title}
                </p>
                <p className="mt-0.5 text-[11px] text-muted-foreground leading-tight">
                  {unlocked ? badge.description : badge.condition}
                </p>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
