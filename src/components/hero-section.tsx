'use client'

import Link from 'next/link'
import { Film, Tv, Shuffle, Users } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

const ACTIONS = [
  {
    icon: Film,
    label: 'Подобрать фильм',
    description: 'Квиз за 30 сек',
    href: '/quiz?start=movie',
    isRoulette: false,
  },
  {
    icon: Tv,
    label: 'Подобрать сериал',
    description: 'Квиз за 30 сек',
    href: '/quiz?start=tv',
    isRoulette: false,
  },
  {
    icon: Shuffle,
    label: 'Кинорулетка',
    description: '1 клик — 1 фильм',
    href: '/roulette',
    isRoulette: true,
  },
  {
    icon: Users,
    label: 'Вечер с партнёром',
    description: 'Выбор на двоих',
    href: '/partner',
    isRoulette: false,
  },
]

const TILE_BASE =
  'flex h-full flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring'

const headingVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0, 0, 1] },
  },
}

const tileVariants: Variants = {
  hidden: { opacity: 0, y: 10, scale: 0.98 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.4,
      delay: i * 0.07,
      ease: [0.25, 0, 0, 1],
    },
  }),
}

export function HeroSection() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="py-10 sm:py-14">
      <motion.div
        className="mb-10 text-center"
        variants={prefersReducedMotion ? undefined : headingVariants}
        initial={prefersReducedMotion ? undefined : 'hidden'}
        animate={prefersReducedMotion ? undefined : 'visible'}
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Что посмотреть сегодня?
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Подберём фильм или сериал за 30 секунд
        </p>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {ACTIONS.map(({ icon: Icon, label, description, href, isRoulette }, i) => (
          <motion.div
            key={label}
            custom={i}
            variants={prefersReducedMotion ? undefined : tileVariants}
            initial={prefersReducedMotion ? undefined : 'hidden'}
            animate={prefersReducedMotion ? undefined : 'visible'}
            whileHover={prefersReducedMotion ? undefined : { scale: 1.02 }}
            whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
          >
            <Link
              href={href}
              className={`${TILE_BASE} ${
                isRoulette
                  ? 'bg-roulette text-roulette-foreground hover:opacity-90'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              } transition-opacity`}
            >
              <Icon className="size-7 shrink-0" />
              <span className="text-sm font-semibold leading-tight">{label}</span>
              <span className="text-xs opacity-70">{description}</span>
            </Link>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
