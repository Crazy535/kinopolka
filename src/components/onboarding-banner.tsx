import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export function OnboardingBanner() {
  return (
    <div className="mb-8 flex items-center gap-4 rounded-xl border border-primary/30 bg-primary/5 px-5 py-4">
      <Sparkles className="h-6 w-6 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">Настрой личную ленту</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Выбери фильмы, которые нравятся — покажем то, что точно зайдёт
        </p>
      </div>
      <Link
        href="/onboarding"
        className="shrink-0 rounded-full bg-primary px-4 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
      >
        Начать
      </Link>
    </div>
  )
}
