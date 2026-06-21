'use client'

import { motion, useReducedMotion, type Variants } from 'framer-motion'
import { ModeGrid } from './home/mode-grid'

const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]

const containerVariants: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.12, delayChildren: 0.05 },
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
    <section className="py-8 sm:py-12 lg:py-16">
      <motion.div className="flex flex-col gap-8" {...motionProps}>

        <motion.div className="flex flex-col gap-2" {...childProps}>
          <h1 className="font-heading text-[2.8rem] font-bold leading-[1.08] tracking-[-0.02em] sm:text-6xl lg:text-7xl">
            Что смотрим<br className="hidden sm:block" /> сегодня?
          </h1>
          <p className="max-w-[38ch] text-lg text-muted-foreground sm:text-xl">
            Квиз за 30&nbsp;секунд&nbsp;— и фильм найден
          </p>
        </motion.div>

        <motion.div {...childProps}>
          <ModeGrid />
        </motion.div>

      </motion.div>
    </section>
  )
}
