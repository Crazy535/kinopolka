'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import type { LucideIcon } from 'lucide-react'

const EXPO_OUT: [number, number, number, number] = [0.19, 1, 0.22, 1]

interface ModeCardProps {
  href: string
  icon: LucideIcon
  title: string
  description: string
  from: string
  to: string
  index: number
}

export function ModeCard({ href, icon: Icon, title, description, from, to, index }: ModeCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07, duration: 0.55, ease: EXPO_OUT }}
    >
      <Link href={href} className="group block h-full">
        <motion.div
          className="relative flex h-full min-h-[80px] flex-col justify-between overflow-hidden rounded-xl p-4 sm:min-h-[140px] sm:p-6"
          style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}
          whileHover={{ scale: 1.02, y: -4 }}
          transition={{ duration: 0.22, ease: EXPO_OUT }}
        >
          <Icon className="size-6 text-white/85 sm:size-7" />

          <div>
            <h3 className="text-base font-bold text-white sm:text-lg">{title}</h3>
            <p className="mt-0.5 text-xs text-white/65 sm:text-sm">{description}</p>
          </div>

          {/* Hover shine */}
          <div
            className="absolute inset-0 rounded-xl bg-white/0 transition-colors duration-200 group-hover:bg-white/[0.04]"
            aria-hidden
          />
        </motion.div>
      </Link>
    </motion.div>
  )
}
