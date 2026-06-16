'use client'

import { useTransition } from 'react'
import { X } from 'lucide-react'
import { removeLog } from '@/actions/diary'

export function DiaryRemoveButton({ logId }: { logId: string }) {
  const [isPending, startTransition] = useTransition()

  function handleClick(e: React.MouseEvent) {
    e.preventDefault()
    startTransition(async () => {
      await removeLog(logId)
    })
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label="Удалить из дневника"
      className="absolute right-2 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-black/60 text-white/70 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-black/80 hover:text-white disabled:opacity-40"
    >
      <X className="size-3.5" strokeWidth={2.5} />
    </button>
  )
}
