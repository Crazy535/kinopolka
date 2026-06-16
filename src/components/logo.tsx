'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'

const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]

export function Logo() {
  return (
    <Link
      href="/"
      aria-label="Кинополка — на главную"
      className="outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-md"
    >
      <motion.div
        whileHover="hover"
        initial="idle"
        className="flex items-center"
      >
        <motion.div
          variants={{
            idle: {
              scale: 1,
              filter: 'drop-shadow(0 0 0px rgba(205, 62, 40, 0))',
            },
            hover: {
              scale: 1.04,
              filter: 'drop-shadow(0 0 10px rgba(205, 62, 40, 0.55))',
            },
          }}
          transition={{ duration: 0.28, ease: EXPO_OUT }}
        >
          <Image
            src="/logo.png"
            alt="Кинополка"
            width={220}
            height={60}
            className="h-12 w-auto object-contain"
            priority
          />
        </motion.div>
      </motion.div>
    </Link>
  )
}
