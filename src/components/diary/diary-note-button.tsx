'use client'

import { useState, useRef, useTransition } from 'react'
import { Pencil, Check, X } from 'lucide-react'
import { addNote } from '@/actions/diary'

export function DiaryNoteButton({
  logId,
  initialNote,
}: {
  logId: string
  initialNote: string | null
}) {
  const [editing, setEditing] = useState(false)
  const [note, setNote] = useState(initialNote ?? '')
  const [saved, setSaved] = useState(initialNote ?? '')
  const [isPending, startTransition] = useTransition()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function openEditor() {
    setEditing(true)
    setTimeout(() => textareaRef.current?.focus(), 30)
  }

  function handleSave() {
    startTransition(async () => {
      await addNote(logId, note)
      setSaved(note)
      setEditing(false)
    })
  }

  function handleCancel() {
    setNote(saved)
    setEditing(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        title={saved ? 'Изменить заметку' : 'Добавить заметку'}
        aria-label="Заметка"
        className="absolute right-9 top-2 z-10 flex size-6 items-center justify-center rounded-full bg-black/60 text-white/75 opacity-0 backdrop-blur-sm transition-all group-hover:opacity-100 hover:bg-black/80 hover:text-white"
      >
        <Pencil className="size-3" />
      </button>

      {editing ? (
        <div className="mt-1.5 flex flex-col gap-1">
          <textarea
            ref={textareaRef}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSave()
              if (e.key === 'Escape') handleCancel()
            }}
            placeholder="Заметка..."
            rows={2}
            className="w-full resize-none rounded-md border border-border/60 bg-muted/50 px-2 py-1.5 text-[11px] leading-tight text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none"
          />
          <div className="flex justify-end gap-1">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isPending}
              aria-label="Отмена"
              className="flex h-5 w-5 items-center justify-center rounded bg-muted/60 text-muted-foreground hover:text-foreground disabled:opacity-50"
            >
              <X className="size-3" />
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isPending}
              aria-label="Сохранить"
              className="flex h-5 w-5 items-center justify-center rounded bg-primary/80 text-primary-foreground hover:bg-primary disabled:opacity-50"
            >
              <Check className="size-3" />
            </button>
          </div>
        </div>
      ) : saved ? (
        <button
          type="button"
          onClick={openEditor}
          className="mt-1.5 w-full text-left"
          title="Изменить заметку"
        >
          <p className="line-clamp-2 text-[11px] leading-tight text-muted-foreground">{saved}</p>
        </button>
      ) : null}
    </>
  )
}
