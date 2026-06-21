'use client'

import { useEffect, useState } from 'react'

export function HeaderShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={`sticky top-0 z-50 w-full border-b border-border/60 bg-background/92 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 transition-shadow duration-200 ${
        scrolled ? 'shadow-[0_2px_20px_0_rgba(0,0,0,0.35)]' : 'shadow-none'
      }`}
    >
      {children}
    </header>
  )
}
