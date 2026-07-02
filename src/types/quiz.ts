import { Laugh, Drama, Swords, Ghost, Rocket, Heart, Eye, Palette, Zap, Clock3, Popcorn, AlarmClock } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { TMDBMovie, TMDBTVShow, WatchProvidersByType } from './tmdb'

export type ContentType = 'movie' | 'tv'
export type RuntimeOption = 'short' | 'medium' | 'long' | 'any'

export interface GenreMood {
  label: string
  icon: LucideIcon
  movieGenreId: number
  tvGenreId: number
}

export interface RecommendationItem {
  movie: TMDBMovie | TMDBTVShow
  providers: WatchProvidersByType | null
}

export const MOODS: GenreMood[] = [
  { label: 'Комедия',    icon: Laugh,   movieGenreId: 35,    tvGenreId: 35    },
  { label: 'Драма',      icon: Drama,   movieGenreId: 18,    tvGenreId: 18    },
  { label: 'Боевик',     icon: Swords,  movieGenreId: 28,    tvGenreId: 10759 },
  { label: 'Ужасы',      icon: Ghost,   movieGenreId: 27,    tvGenreId: 9648  },
  { label: 'Фантастика', icon: Rocket,  movieGenreId: 878,   tvGenreId: 10765 },
  { label: 'Мелодрама',  icon: Heart,   movieGenreId: 10749, tvGenreId: 10766 },
  { label: 'Триллер',    icon: Eye,     movieGenreId: 53,    tvGenreId: 80    },
  { label: 'Анимация',   icon: Palette, movieGenreId: 16,    tvGenreId: 16    },
]

export const RUNTIMES = [
  { value: 'short'  as RuntimeOption, label: 'Быстро',        sublabel: 'до 90 мин',   icon: Zap        },
  { value: 'medium' as RuntimeOption, label: 'В самый раз',   sublabel: '90–150 мин',  icon: Clock3     },
  { value: 'long'   as RuntimeOption, label: 'Не торопимся',  sublabel: '150+ мин',    icon: Popcorn    },
  { value: 'any'    as RuntimeOption, label: 'Неважно',       sublabel: '',            icon: AlarmClock },
]
