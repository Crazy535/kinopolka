import { redirect } from 'next/navigation'
import { Film } from 'lucide-react'
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
    <div className="flex flex-col items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Film className="mx-auto mb-4 size-10 text-primary" strokeWidth={1.5} />
          <h1 className="text-3xl font-bold text-foreground">Вечер с партнёром</h1>
          <p className="mt-3 text-muted-foreground">
            Найдём фильм, который понравится вам обоим
          </p>
        </div>
        <PartnerCreateRoom hasTasteProfile={!!profile} genreIds={profile?.genreIds ?? []} />
      </div>
    </div>
  )
}
