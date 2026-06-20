'use client'

import { Film, Tv, Shuffle, Users, Search, Gamepad2 } from 'lucide-react'
import { ModeCard } from './mode-card'
import { useFeatureFlagVariant } from '@/hooks/use-feature-flag'

const BASE_MODES = [
  {
    href: '/quiz?start=movie',
    icon: Film,
    title: 'Фильм',
    description: 'Квиз за 30 секунд',
    from: 'oklch(0.58 0.22 18)',
    to: 'oklch(0.42 0.20 18)',
  },
  {
    href: '/quiz?start=tv',
    icon: Tv,
    title: 'Сериал',
    description: 'Найти следующий',
    from: 'oklch(0.32 0.12 265)',
    to: 'oklch(0.20 0.10 265)',
  },
  {
    href: '/roulette',
    icon: Shuffle,
    title: 'Кинорулетка',
    description: 'Удиви меня',
    from: 'oklch(0.72 0.16 80)',
    to: 'oklch(0.56 0.14 80)',
  },
  {
    href: '/partner',
    icon: Users,
    title: 'С партнёром',
    description: 'Вечер вдвоём',
    from: 'oklch(0.50 0.15 195)',
    to: 'oklch(0.36 0.12 195)',
  },
]

const WIDE_MODES = [
  {
    href: '/detective',
    icon: Search,
    title: 'Кино-детектив',
    description: 'Опиши — найдём',
    from: 'oklch(0.42 0.14 290)',
    to: 'oklch(0.28 0.12 290)',
  },
  {
    href: '/game/daily',
    icon: Gamepad2,
    title: 'Угадай фильм',
    description: 'Новая загадка каждый день',
    from: 'oklch(0.44 0.14 145)',
    to: 'oklch(0.30 0.12 145)',
  },
] as const

export function ModeGrid() {
  const ctaVariant = useFeatureFlagVariant('quiz_film_cta')

  const MODES = BASE_MODES.map((m, i) => {
    if (i === 0 && ctaVariant === 'direct') {
      return { ...m, description: 'Найди за 30 сек' }
    }
    return m
  })

  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {MODES.map((mode, i) => (
          <ModeCard key={mode.href} {...mode} index={i} />
        ))}
      </div>
      {WIDE_MODES.map((mode, i) => (
        <ModeCard key={mode.href} {...mode} index={MODES.length + i} wide />
      ))}
    </div>
  )
}
