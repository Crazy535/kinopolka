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
      <div className="flex items-center justify-center py-24 text-center">
        <div>
          <p className="text-2xl font-bold text-foreground mb-2">Комната истекла</p>
          <p className="text-muted-foreground">Создайте новую комнату</p>
          <a href="/partner" className="mt-4 inline-block text-primary hover:text-primary/80 underline">
            Создать новую
          </a>
        </div>
      </div>
    )
  }

  // If room already has a different guest — block access
  if (room.guestId && room.guestId !== session.user.id && room.hostId !== session.user.id) {
    return (
      <div className="flex items-center justify-center py-24 text-center">
        <div>
          <p className="text-2xl font-bold text-foreground mb-2">Комната занята</p>
          <p className="text-muted-foreground">В этой комнате уже есть два участника</p>
        </div>
      </div>
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
    hostGenreIds: room.hostGenreIds,
    guestGenreIds: room.guestGenreIds,
    items: null,
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <div>
        <PartnerRoom
          code={code}
          userId={session.user.id}
          hasTasteProfile={!!profile}
          initialRoom={initialRoom}
          baseUrl={baseUrl}
          userGenreIds={profile?.genreIds ?? []}
        />
      </div>
    </div>
  )
}
