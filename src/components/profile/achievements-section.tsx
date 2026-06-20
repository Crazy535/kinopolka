import {
  Clapperboard, Trophy, Star, Film, Compass, Users, Bookmark,
  BookOpen, ThumbsUp, ThumbsDown, Zap, Layers, Heart, Award,
  Flame, Crown, Library, Swords, Eye, Lock
} from 'lucide-react'
import { BADGES, type BadgeId } from '@/lib/achievements'

const BADGE_ICONS: Record<BadgeId, React.ReactNode> = {
  first_watch:      <Clapperboard className="size-5" />,
  cinephile_10:     <Film className="size-5" />,
  cinephile_25:     <Eye className="size-5" />,
  cinephile_50:     <Flame className="size-5" />,
  cinephile_100:    <Crown className="size-5" />,
  taste_defined:    <Heart className="size-5" />,
  genre_master:     <Layers className="size-5" />,
  genre_all:        <Zap className="size-5" />,
  explorer:         <Compass className="size-5" />,
  director_fan:     <Award className="size-5" />,
  partner:          <Users className="size-5" />,
  partner_veteran:  <Swords className="size-5" />,
  collector:        <Bookmark className="size-5" />,
  mega_collector:   <Library className="size-5" />,
  watchlist_addict: <Trophy className="size-5" />,
  critic:           <Star className="size-5" />,
  movie_critic:     <ThumbsUp className="size-5" />,
  perfectionist:    <Star className="size-5" />,
  harsh_critic:     <ThumbsDown className="size-5" />,
  diary_keeper:     <BookOpen className="size-5" />,
}

const CATEGORY_LABELS: Record<string, string> = {
  watch:      'Просмотры',
  taste:      'Вкус',
  social:     'Социальное',
  collection: 'Коллекция',
  rating:     'Оценки',
  diary:      'Дневник',
}

interface Props {
  unlockedIds: BadgeId[]
  totalXp?: number
  level?: number
}

export function AchievementsSection({ unlockedIds, totalXp = 0, level = 1 }: Props) {
  const unlockedSet = new Set(unlockedIds)
  const unlockedCount = unlockedIds.length

  const categories = Array.from(new Set(BADGES.map((b) => b.category)))

  return (
    <div className="mb-10">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-bold tracking-tight">Достижения</h2>
        <span className="text-sm text-muted-foreground">
          {unlockedCount} / {BADGES.length}
        </span>
      </div>

      {categories.map((cat) => {
        const catBadges = BADGES.filter((b) => b.category === cat)
        return (
          <div key={cat} className="mb-6">
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {CATEGORY_LABELS[cat]}
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
              {catBadges.map((badge) => {
                const unlocked = unlockedSet.has(badge.id)
                return (
                  <div
                    key={badge.id}
                    title={unlocked ? badge.description : badge.condition}
                    className={`relative flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-colors ${
                      unlocked
                        ? 'border-primary/30 bg-primary/5'
                        : 'border-border bg-muted/30 opacity-55'
                    }`}
                  >
                    <div
                      className={`flex size-10 items-center justify-center rounded-full ${
                        unlocked
                          ? 'bg-primary/15 text-primary'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      {unlocked ? BADGE_ICONS[badge.id] : <Lock className="size-4" />}
                    </div>
                    <div>
                      <p className={`text-[12px] font-semibold leading-tight ${unlocked ? '' : 'text-muted-foreground'}`}>
                        {badge.title}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground leading-tight">
                        {unlocked ? badge.description : badge.condition}
                      </p>
                    </div>
                    {unlocked && (
                      <span className="absolute right-2 top-2 rounded-full bg-primary/20 px-1.5 py-0.5 text-[9px] font-bold text-primary">
                        +{badge.xp} XP
                      </span>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
