import { notFound, redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { PartnerRoom } from '@/components/partner/partner-room'

export const dynamic = 'force-dynamic'

export default async function PartnerRoomPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const session = await auth()

  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=${encodeURIComponent(`/partner/${code}`)}`)
  }

  const room = await prisma.partnerRoom.findUnique({
    where: { code },
    include: {
      host: { select: { id: true, name: true, image: true } },
      guest: { select: { id: true, name: true, image: true } },
    },
  })

  if (!room) notFound()

  if (room.expiresAt < new Date()) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2">Комната истекла</p>
          <p className="text-slate-400">Создайте новую комнату</p>
          <a href="/partner" className="mt-4 inline-block text-violet-400 hover:text-violet-300 underline">
            Создать новую
          </a>
        </div>
      </main>
    )
  }

  // If room already has a different guest — block access
  if (room.guestId && room.guestId !== session.user.id && room.hostId !== session.user.id) {
    return (
      <main className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl font-bold text-white mb-2">Комната занята</p>
          <p className="text-slate-400">В этой комнате уже есть два участника</p>
        </div>
      </main>
    )
  }

  const profile = await prisma.tasteProfile.findUnique({
    where: { userId: session.user.id },
  })

  const hdrs = await headers()
  const host = hdrs.get('host') ?? 'kinopolka.vercel.app'
  const proto = hdrs.get('x-forwarded-proto') ?? 'https'
  const baseUrl = `${proto}://${host}`

  const initialRoom = {
    code: room.code,
    status: room.status as 'waiting' | 'active' | 'done',
    host: room.host,
    guest: room.guest,
    items: null,
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <PartnerRoom
          code={code}
          userId={session.user.id}
          hasTasteProfile={!!profile}
          initialRoom={initialRoom}
          baseUrl={baseUrl}
          userGenreIds={profile?.genreIds ?? []}
        />
      </div>
    </main>
  )
}
