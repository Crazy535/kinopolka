import Link from 'next/link'

export function OnboardingBanner() {
  return (
    <div className="mb-8 flex items-center justify-between gap-4 rounded-lg border border-primary/20 bg-primary/8 px-5 py-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">Настрой личную ленту</p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          Выбери фильмы по вкусу — получи рекомендации именно для тебя
        </p>
      </div>
      <Link
        href="/onboarding"
        className="shrink-0 rounded-md bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
      >
        Настроить
      </Link>
    </div>
  )
}
