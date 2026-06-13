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
    <nav aria-label="Основная навигация" className="hidden sm:flex items-center gap-1">
      {NAV_ITEMS.map(({ label, href }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className="relative px-3 py-1.5 text-sm font-medium transition-colors rounded-lg"
            style={{ color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)' }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--foreground)'
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLElement).style.color = 'var(--muted-foreground)'
            }}
          >
            {isActive && (
              <motion.span
                layoutId="nav-active-bg"
                className="absolute inset-0 rounded-lg bg-white/[0.07]"
                transition={{ type: 'spring', stiffness: 400, damping: 35 }}
              />
            )}
            <span className="relative z-10">{label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
