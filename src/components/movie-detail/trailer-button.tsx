'use client'

import { useEffect, useRef, useState } from 'react'
import { Play, X } from 'lucide-react'

interface TrailerButtonProps {
  trailerKey: string
  title?: string
}

export function TrailerButton({ trailerKey, title }: TrailerButtonProps) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return
    if (open) {
      el.showModal()
    } else {
      el.close()
    }
  }, [open])

  useEffect(() => {
    const el = dialogRef.current
    if (!el) return

    function onClose() {
      setOpen(false)
    }
    function onBackdropClick(e: MouseEvent) {
      const rect = el!.getBoundingClientRect()
      const clickedOutside =
        e.clientX < rect.left ||
        e.clientX > rect.right ||
        e.clientY < rect.top ||
        e.clientY > rect.bottom
      if (clickedOutside) setOpen(false)
    }

    el.addEventListener('close', onClose)
    el.addEventListener('click', onBackdropClick)
    return () => {
      el.removeEventListener('close', onClose)
      el.removeEventListener('click', onBackdropClick)
    }
  }, [])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-medium text-primary transition-colors hover:bg-primary/20"
      >
        <Play className="size-4 fill-primary" />
        Трейлер
      </button>

      <dialog
        ref={dialogRef}
        className="m-auto max-h-[90vh] w-full max-w-3xl rounded-xl bg-black p-0 backdrop:bg-black/80 backdrop:backdrop-blur-sm"
      >
        <div className="relative aspect-video w-full">
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Закрыть"
            className="absolute right-3 top-3 z-10 flex size-8 items-center justify-center rounded-full bg-black/60 text-white/80 transition-colors hover:bg-black/80 hover:text-white"
          >
            <X className="size-4" />
          </button>
          {open && (
            <iframe
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&rel=0`}
              title={title ?? 'Трейлер'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="h-full w-full rounded-xl"
            />
          )}
        </div>
      </dialog>
    </>
  )
}
