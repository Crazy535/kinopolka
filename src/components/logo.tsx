'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'

const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]

function FilmMark() {
  return (
    <svg
      width="34"
      height="30"
      viewBox="0 0 34 30"
      fill="none"
      aria-hidden
    >
      {/* Main film frame body */}
      <rect width="34" height="30" rx="4" fill="currentColor" />

      {/* Left perforation strip (dark sidebar) */}
      <rect x="0" y="0" width="8" height="30" rx="4" fill="black" opacity="0.20" />
      {/* Right perforation strip */}
      <rect x="26" y="0" width="8" height="30" rx="4" fill="black" opacity="0.20" />

      {/* Perforations left — 3 holes */}
      <rect x="2" y="4.5" width="4" height="5.5" rx="1.5" fill="white" opacity="0.90" />
      <rect x="2" y="12.25" width="4" height="5.5" rx="1.5" fill="white" opacity="0.90" />
      <rect x="2" y="20" width="4" height="5.5" rx="1.5" fill="white" opacity="0.90" />

      {/* Perforations right — 3 holes */}
      <rect x="28" y="4.5" width="4" height="5.5" rx="1.5" fill="white" opacity="0.90" />
      <rect x="28" y="12.25" width="4" height="5.5" rx="1.5" fill="white" opacity="0.90" />
      <rect x="28" y="20" width="4" height="5.5" rx="1.5" fill="white" opacity="0.90" />

      {/* Play triangle — centered in content area (x: 8-26, center: 17) */}
      <polygon points="13,9.5 24,15 13,20.5" fill="white" opacity="0.96" />
    </svg>
  )
}

export function Logo() {
  return (
    <Link href="/" aria-label="Кинополка — на главную" className="outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-md">
      <motion.div
        className="flex items-center gap-3 select-none"
        whileHover="hover"
        initial="idle"
      >
        {/* Film mark icon */}
        <motion.div
          className="text-primary shrink-0"
          variants={{
            idle: {
              scale: 1,
              filter: 'drop-shadow(0 0 0px rgba(205, 62, 40, 0))',
            },
            hover: {
              scale: 1.07,
              filter: 'drop-shadow(0 0 10px rgba(205, 62, 40, 0.62))',
            },
          }}
          transition={{ duration: 0.28, ease: EXPO_OUT }}
        >
          <FilmMark />
        </motion.div>

        {/* Wordmark */}
        <motion.span
          className="font-heading font-bold leading-none tracking-[-0.03em] text-[1.35rem] sm:text-[1.6rem]"
          variants={{
            idle: { opacity: 0.90 },
            hover: { opacity: 1 },
          }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-primary">К</span>
          <span className="text-foreground">инополка</span>
        </motion.span>
      </motion.div>
    </Link>
  )
}
