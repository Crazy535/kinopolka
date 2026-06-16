'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

const BASE_ITEMS = [
  { label: 'Квиз', href: '/quiz' },
  { label: 'Рулетка', href: '/roulette' },
  { label: 'Партнёр', href: '/partner' },
]

const AUTH_EXTRA = { label: 'Дневник', href: '/diary' }

interface NavLinksProps {
  isAuthenticated?: boolean
}

export function NavLinks({ isAuthenticated = false }: NavLinksProps) {
  const pathname = usePathname()
  const items = isAuthenticated ? [...BASE_ITEMS, AUTH_EXTRA] : BASE_ITEMS

  return (
    <nav aria-label="Основная навигация" className="hidden sm:flex items-center gap-0.5">
      {items.map(({ label, href }) => {
        const isActive = pathname === href || pathname.startsWith(href + '/')
        return (
          <Link
            key={href}
            href={href}
            className={`relative px-3 py-1.5 text-[15px] font-medium transition-colors duration-150 rounded-md ${
              isActive ? 'text-foreground' : 'text-foreground/60 hover:text-foreground'
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
