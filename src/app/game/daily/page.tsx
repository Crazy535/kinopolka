import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft, Gamepad2 } from 'lucide-react'
import { DailyGameContainer } from '@/components/game/daily-game-container'

export const metadata: Metadata = {
  title: 'Угадай фильм — Кинополка',
  description: 'Ежедневная кино-загадка: угадай фильм по подсказкам. Новая загадка каждый день.',
}

export default function DailyGamePage() {
  return (
    <div className="pb-12">
      <Link
        href="/"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        На главную
      </Link>

      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Gamepad2 className="size-6" />
        </div>
        <h1 className="font-heading text-2xl font-bold tracking-tight sm:text-3xl">
          Угадай фильм
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Новая загадка каждый день — угадай по подсказкам
        </p>
      </div>

      <DailyGameContainer />
    </div>
  )
}
