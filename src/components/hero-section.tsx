import { Film, Tv, Shuffle, Users } from 'lucide-react'

const ACTIONS = [
  {
    icon: Film,
    label: 'Подобрать фильм',
    description: 'Квиз за 30 сек',
    className: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
  },
  {
    icon: Tv,
    label: 'Подобрать сериал',
    description: 'Квиз за 30 сек',
    className: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
  },
  {
    icon: Shuffle,
    label: 'Кинорулетка',
    description: '1 клик — 1 фильм',
    className: 'bg-roulette hover:bg-roulette/90 text-roulette-foreground',
  },
  {
    icon: Users,
    label: 'Вечер с партнёром',
    description: 'Выбор на двоих',
    className: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground',
  },
] as const

export function HeroSection() {
  return (
    <section className="py-10 sm:py-14">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
          Что посмотреть сегодня?
        </h1>
        <p className="mt-3 text-base text-muted-foreground sm:text-lg">
          Подберём фильм или сериал за 30 секунд
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {ACTIONS.map(({ icon: Icon, label, description, className }) => (
          <button
            key={label}
            type="button"
            className={`flex flex-col items-center justify-center gap-2 rounded-xl px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${className}`}
          >
            <Icon className="size-7 shrink-0" />
            <span className="text-sm font-semibold leading-tight">{label}</span>
            <span className="text-xs opacity-70">{description}</span>
          </button>
        ))}
      </div>
    </section>
  )
}
