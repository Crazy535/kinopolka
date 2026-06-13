'use client'

import { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { LogIn, LogOut, User, Bookmark } from 'lucide-react'

interface UserData {
  name?: string | null
  email?: string | null
  image?: string | null
}

interface Props {
  user: UserData | null
}

export function UserMenu({ user }: Props) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  if (!user) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted transition-colors"
      >
        <LogIn className="h-3.5 w-3.5" />
        Войти
      </Link>
    )
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full p-0.5 hover:ring-2 ring-primary/50 transition-all"
        aria-expanded={open}
        aria-label="Меню пользователя"
      >
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? 'Аватар'}
            width={32}
            height={32}
            className="rounded-full"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
            <User className="h-4 w-4 text-primary" />
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-border bg-background shadow-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-border">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <Link
            href="/profile"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <User className="h-4 w-4" />
            Профиль
          </Link>
          <Link
            href="/watchlist"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors"
          >
            <Bookmark className="h-4 w-4" />
            Вотчлист
          </Link>
          <button
            onClick={() => { setOpen(false); signOut() }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Выйти
          </button>
        </div>
      )}
    </div>
  )
}
