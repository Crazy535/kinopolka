'use client'

import { Film, Tv, Shuffle, Users } from 'lucide-react'
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

export function ModeGrid() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4">
      {MODES.map((mode, i) => (
        <ModeCard key={mode.href} {...mode} index={i} />
      ))}
    </div>
  )
}
