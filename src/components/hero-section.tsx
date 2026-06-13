'use client'

import Link from 'next/link'
import { Film, Tv, Shuffle, Users } from 'lucide-react'
import { motion, useReducedMotion, type Variants } from 'framer-motion'

const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.10, delayChildren: 0.05 },
  },
}

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: EXPO_OUT },
  },
}

export function HeroSection() {
  const reduced = useReducedMotion()

  const motionProps = reduced
    ? {}
    : { variants: containerVariants, initial: 'hidden', animate: 'visible' }

  const childProps = reduced ? {} : { variants: itemVariants }

  return (
    <section className="py-12 sm:py-16 lg:py-20">
      <motion.div className="flex flex-col gap-8 sm:gap-10" {...motionProps}>

        {/* Headline */}
        <motion.div className="flex flex-col gap-3" {...childProps}>
          <h1 className="font-heading text-[2.8rem] font-bold leading-[1.08] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
            Что смотрим<br className="hidden sm:block" /> сегодня?
          </h1>
          <p className="text-base text-muted-foreground sm:text-lg" style={{ maxWidth: '38ch' }}>
            Квиз за 30&nbsp;секунд&nbsp;— и фильм найден
          </p>
        </motion.div>

        {/* Primary CTAs */}
        <motion.div className="flex flex-col gap-3 sm:flex-row" {...childProps}>
          <Link
            href="/quiz?start=movie"
            className="group flex items-center justify-center gap-2.5 rounded-lg bg-primary px-7 py-4 text-[15px] font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_20px_oklch(0.58_0.22_18_/_0.35)] sm:flex-1"
          >
            <Film className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Подобрать фильм
          </Link>
          <Link
            href="/quiz?start=tv"
            className="group flex items-center justify-center gap-2.5 rounded-lg bg-primary px-7 py-4 text-[15px] font-semibold text-primary-foreground transition-all duration-200 hover:bg-primary/90 hover:shadow-[0_4px_20px_oklch(0.58_0.22_18_/_0.35)] sm:flex-1"
          >
            <Tv className="size-5 shrink-0 transition-transform duration-300 group-hover:-translate-x-0.5" />
            Подобрать сериал
          </Link>
        </motion.div>

        {/* Secondary actions */}
        <motion.div className="flex items-center gap-5" {...childProps}>
          <Link
            href="/roulette"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-gold"
          >
            <Shuffle className="size-4" />
            Кинорулетка
          </Link>
          <span className="h-3.5 w-px bg-border" aria-hidden />
          <Link
            href="/partner"
            className="flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground"
          >
            <Users className="size-4" />
            Вечер с партнёром
          </Link>
        </motion.div>

      </motion.div>
    </section>
  )
}
