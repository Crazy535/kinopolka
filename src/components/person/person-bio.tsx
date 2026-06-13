'use client'

import { useState } from 'react'

interface PersonBioProps {
  biography: string
}

export function PersonBio({ biography }: PersonBioProps) {
  const [expanded, setExpanded] = useState(false)
  const isLong = biography.length > 420

  return (
    <div className="mb-8">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        Биография
      </p>
      <p
        className={`text-sm leading-relaxed text-foreground/80 sm:text-base ${
          !expanded && isLong ? 'line-clamp-4' : ''
        }`}
      >
        {biography}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-2 text-sm font-medium text-primary transition-colors hover:text-primary/80"
        >
          {expanded ? 'Свернуть' : 'Читать далее'}
        </button>
      )}
    </div>
  )
}
