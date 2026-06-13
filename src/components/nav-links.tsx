'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const NAV_ITEMS = [
  { label: 'Квиз', href: '/quiz' },
  { label: 'Рулетка', href: '/roulette' },
  { label: 'Партнёр', href: '/partner' },
]

export function NavLinks() {
  const pathname = usePathname()

  return (
    <nav aria-label="Основная навигация" className="hidden sm:flex items-center gap-0.5">
      {NAV_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`relative px-3 py-1.5 text-sm font-medium transition-colors duration-150 rounded-md ${
              isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <span className="relative z-10">{label}</span>
            {isActive && (
              <motion.span
                layoutId="nav-indicator"
                className="absolute bottom-0 left-1/2 h-0.5 w-4 -translate-x-1/2 rounded-full bg-primary"
                transition={{ type: 'spring', stiffness: 500, damping: 35 }}
              />
            )}
          </Link>
        )
      })}
    </nav>
  )
}
