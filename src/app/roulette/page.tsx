import { RouletteContainer } from '@/components/roulette/roulette-container'

export const dynamic = 'force-dynamic'

export default function RoulettePage() {
  return (
    <main className="py-8 sm:py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Кинорулетка</h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Один вопрос — один фильм
        </p>
      </div>
      <RouletteContainer />
    </main>
  )
}
