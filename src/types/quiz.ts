import type { TMDBMovie, TMDBTVShow, WatchProvidersByType } from './tmdb'

export type ContentType = 'movie' | 'tv'
export type RuntimeOption = 'short' | 'medium' | 'long' | 'any'

export interface GenreMood {
  label: string
  emoji: string
  movieGenreId: number
  tvGenreId: number
}

export interface RecommendationItem {
  movie: TMDBMovie | TMDBTVShow
  providers: WatchProvidersByType | null
}

export const MOODS: GenreMood[] = [
  { label: 'Комедия',    emoji: '😄', movieGenreId: 35,    tvGenreId: 35    },
  { label: 'Драма',      emoji: '🎭', movieGenreId: 18,    tvGenreId: 18    },
  { label: 'Боевик',     emoji: '⚔️', movieGenreId: 28,    tvGenreId: 10759 },
  { label: 'Ужасы',      emoji: '😱', movieGenreId: 27,    tvGenreId: 9648  },
  { label: 'Фантастика', emoji: '🚀', movieGenreId: 878,   tvGenreId: 10765 },
  { label: 'Мелодрама',  emoji: '💕', movieGenreId: 10749, tvGenreId: 10766 },
  { label: 'Триллер',    emoji: '🔍', movieGenreId: 53,    tvGenreId: 80    },
  { label: 'Анимация',   emoji: '🎨', movieGenreId: 16,    tvGenreId: 16    },
]

export const RUNTIMES = [
  { value: 'short'  as RuntimeOption, label: 'Быстро',        sublabel: 'до 90 мин',   emoji: '⚡' },
  { value: 'medium' as RuntimeOption, label: 'В самый раз',   sublabel: '90–150 мин',  emoji: '🎭' },
  { value: 'long'   as RuntimeOption, label: 'Не торопимся',  sublabel: '150+ мин',    emoji: '🍿' },
  { value: 'any'    as RuntimeOption, label: 'Неважно',       sublabel: '',            emoji: '⏰' },
]
