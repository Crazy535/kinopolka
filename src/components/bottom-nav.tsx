'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import { Home, Film, Shuffle, Bookmark, BookOpen, Users, Layers } from 'lucide-react'

const ANON_ITEMS = [
  { href: '/',         icon: Home,    label: 'Главная',  exact: true  },
  { href: '/quiz',     icon: Film,    label: 'Квиз',     exact: false },
  { href: '/roulette', icon: Shuffle, label: 'Рулетка',  exact: false },
  { href: '/partner',  icon: Users,   label: 'Партнёр',  exact: false },
] as const

const AUTH_ITEMS = [
  { href: '/',          icon: Home,     label: 'Главная',  exact: true  },
  { href: '/quiz',      icon: Film,     label: 'Квиз',     exact: false },
  { href: '/swipe',     icon: Layers,   label: 'Свайп',    exact: false },
  { href: '/watchlist', icon: Bookmark, label: 'Список',   exact: false },
  { href: '/diary',     icon: BookOpen, label: 'Дневник',  exact: false },
] as const

interface BottomNavProps {
  isAuthenticated?: boolean
}

export function BottomNav({ isAuthenticated = false }: BottomNavProps) {
  const pathname = usePathname()
  const items = isAuthenticated ? AUTH_ITEMS : ANON_ITEMS

  function isActive(href: string, exact: boolean) {
    return exact ? pathname === href : pathname.startsWith(href)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)] md:hidden">
      <div className="flex h-16 items-stretch">
        {items.map(({ href, icon: Icon, label, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                active
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-x-1.5 inset-y-2 rounded-xl bg-primary/10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
              <Icon className="relative size-5" strokeWidth={active ? 2.2 : 1.8} />
              <span className="relative text-[11px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
