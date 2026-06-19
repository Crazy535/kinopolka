'use client'

import { Film, Tv, Shuffle, Users, Search } from 'lucide-react'
import { ModeCard } from './mode-card'

const MODES = [
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
] as const

const DETECTIVE_MODE = {
  href: '/detective',
  icon: Search,
  title: 'Кино-детектив',
  description: 'Опиши — найдём',
  from: 'oklch(0.42 0.14 290)',
  to: 'oklch(0.28 0.12 290)',
} as const

export function ModeGrid() {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {MODES.map((mode, i) => (
          <ModeCard key={mode.href} {...mode} index={i} />
        ))}
      </div>
      <ModeCard {...DETECTIVE_MODE} index={MODES.length} wide />
    </div>
  )
}
