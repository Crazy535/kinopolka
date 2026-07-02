'use client'

import { useRef, type MouseEvent, type ReactNode } from 'react'

interface CardSpotlightProps {
  className: string
  children: ReactNode
}

/**
 * Isolated client leaf: tracks pointer position over the card and exposes it as
 * CSS custom properties via a ref (no React state), so hover never re-renders
 * the (server-rendered) card content. Desktop/pointer:fine only.
 */
export function CardSpotlight({ className, children }: CardSpotlightProps) {
  const overlayRef = useRef<HTMLDivElement>(null)

  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    overlayRef.current?.style.setProperty('--spot-x', `${x}%`)
    overlayRef.current?.style.setProperty('--spot-y', `${y}%`)
  }

  return (
    <article className={className} onMouseMove={handleMouseMove}>
      {children}
      <div
        ref={overlayRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 z-40 hidden rounded-lg opacity-0 transition-opacity duration-300 group-hover:opacity-100 [@media(pointer:fine)]:block"
        style={{
          background:
            'radial-gradient(280px circle at var(--spot-x, 50%) var(--spot-y, 50%), oklch(1 0 0 / 0.08), transparent 70%)',
        }}
      />
    </article>
  )
}
