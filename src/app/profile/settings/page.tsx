import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Settings } from 'lucide-react'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { SettingsForm } from '@/components/profile/settings-form'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Настройки — Кинополка',
}

export default async function SettingsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      emailUnsubscribed: true,
      passwordHash: true,
    },
  })

  if (!user) redirect('/')

  return (
    <div className="pb-12">
      <Link
        href="/profile"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        Профиль
      </Link>

      <div className="mb-8 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Settings className="size-6" />
        </div>
        <div>
          <h1 className="font-heading text-2xl font-bold tracking-[-0.02em] sm:text-3xl">Настройки</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Управляйте данными профиля и предпочтениями.
          </p>
        </div>
      </div>

      <div className="max-w-lg">
        <SettingsForm
          initialName={user.name ?? ''}
          initialEmailUnsubscribed={user.emailUnsubscribed}
          hasPassword={!!user.passwordHash}
        />
      </div>
    </div>
  )
}
