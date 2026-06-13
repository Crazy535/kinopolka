'use client'

import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-2 text-2xl font-bold">Что-то пошло не так</h1>
      <p className="mb-8 text-sm text-muted-foreground">
        Попробуй обновить страницу или вернись позже.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
        >
          Попробовать снова
        </button>
        <Link
          href="/"
          className="rounded-xl border border-border px-6 py-2.5 text-sm font-medium transition-colors hover:bg-muted"
        >
          На главную
        </Link>
      </div>
    </div>
  )
}
