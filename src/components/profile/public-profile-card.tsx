'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'
import { User } from 'lucide-react'

interface Props {
  name: string | null
  image: string | null
  level: number
  xp: number
  xpProgress: number
  xpNext: number
  topGenres: string[]
  badgeCount: number
  totalBadges: number
}

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 120, damping: 22 },
  },
}

export function PublicProfileCard({
  name, image, level, xp, xpProgress, xpNext, topGenres, badgeCount, totalBadges,
}: Props) {
  const reduce = useReducedMotion()

  return (
    <motion.div
      className="relative mb-10 overflow-hidden rounded-2xl border border-border/60 bg-gradient-to-br from-primary/10 via-card to-muted/30 p-6 sm:p-8"
      variants={containerVariants}
      initial={reduce ? false : 'hidden'}
      animate="visible"
    >
      {/* Ambient glow — clipped by overflow-hidden, stays within card */}
      <div
        className="pointer-events-none absolute -right-10 -top-10 size-56 rounded-full bg-primary/15 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-start sm:gap-8">

        {/* Avatar */}
        <motion.div variants={itemVariants} className="shrink-0">
          <div className="relative mx-auto size-[76px] sm:size-[92px]">
            <span
              className="pointer-events-none absolute inset-0 scale-[1.18] rounded-full bg-primary/20 blur-md"
              aria-hidden="true"
            />
            <div className="relative size-full overflow-hidden rounded-full ring-2 ring-primary/40 ring-offset-2 ring-offset-background">
              {image ? (
                <Image
                  src={image}
                  alt={name ?? 'Аватар'}
                  fill
                  sizes="92px"
                  className="object-cover"
                  priority
                />
              ) : (
                <div className="flex size-full items-center justify-center bg-muted">
                  <User className="size-7 text-muted-foreground" />
                </div>
              )}
            </div>
            {/* Level pip */}
            <div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full border-2 border-background bg-primary font-mono text-[11px] font-bold leading-none text-primary-foreground">
              {level}
            </div>
          </div>
        </motion.div>

        {/* Info */}
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <motion.h1
            variants={itemVariants}
            className="font-heading text-2xl font-bold leading-tight tracking-tight sm:text-[1.75rem]"
          >
            {name ?? 'Пользователь'}
          </motion.h1>

          <motion.div
            variants={itemVariants}
            className="mt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 sm:justify-start"
          >
            <span className="font-mono text-sm font-semibold text-primary">
              {xp.toLocaleString('ru-RU')} XP
            </span>
            {badgeCount > 0 && (
              <span className="text-xs text-muted-foreground">
                {badgeCount} / {totalBadges} достижений
              </span>
            )}
          </motion.div>

          {/* XP progress bar */}
          <motion.div variants={itemVariants} className="mt-4">
            <div className="h-[3px] w-full overflow-hidden rounded-full bg-muted">
              <motion.div
                className="h-full rounded-full bg-primary"
                style={{ width: `${xpProgress}%` }}
                initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }}
                animate={{ clipPath: 'inset(0 0% 0 0)' }}
                transition={{ duration: 1.1, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <p className="mt-1.5 text-right font-mono text-[11px] text-muted-foreground">
              до Ур. {level + 1} — {xpNext.toLocaleString('ru-RU')} XP
            </p>
          </motion.div>

          {/* Genre tags */}
          {topGenres.length > 0 && (
            <motion.div
              variants={itemVariants}
              className="mt-3 flex flex-wrap justify-center gap-1.5 sm:justify-start"
            >
              {topGenres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-primary/25 bg-primary/10 px-2.5 py-0.5 text-[12px] font-medium text-primary/90"
                >
                  {genre}
                </span>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  )
}
