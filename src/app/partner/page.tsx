import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { PartnerCreateRoom } from '@/components/partner/partner-create-room'

export const dynamic = 'force-dynamic'

export default async function PartnerPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const profile = await prisma.tasteProfile.findUnique({
    where: { userId: session.user.id },
  })

  return (
    <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🎬</div>
          <h1 className="text-3xl font-bold text-white">Вечер с партнёром</h1>
          <p className="mt-3 text-slate-400">
            Найдём фильм, который понравится вам обоим
          </p>
        </div>
        <PartnerCreateRoom hasTasteProfile={!!profile} genreIds={profile?.genreIds ?? []} />
      </div>
    </main>
  )
}
