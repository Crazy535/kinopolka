import { auth } from '@/auth'
import { RouletteContainer } from '@/components/roulette/roulette-container'

export const dynamic = 'force-dynamic'

export default async function RoulettePage() {
  const session = await auth()

  return (
    <div>
      <h1 className="sr-only">Кинорулетка</h1>
      <RouletteContainer isAuthenticated={!!session} />
    </div>
  )
}
