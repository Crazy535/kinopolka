import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { StatCard } from '@/components/admin/stat-card'
import { UsersTable } from '@/components/admin/users-table'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
}

function isAdmin(email?: string | null) {
  const adminEmail = process.env.ADMIN_EMAIL?.trim()
  return !!adminEmail && email?.trim().toLowerCase() === adminEmail.toLowerCase()
}

export default async function AdminPage() {
  const session = await auth()
  if (!isAdmin(session?.user?.email)) redirect('/')

  const now = new Date()
  const d7 = new Date(now.getTime() - 7 * 86_400_000)
  const d30 = new Date(now.getTime() - 30 * 86_400_000)

  const [
    totalUsers,
    newUsers7d,
    newUsers30d,
    totalWatchlist,
    totalRatings,
    totalWatchLogs,
    totalPartnerRooms,
    totalCollections,
    totalAchievements,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: { gte: d7 } } }),
    prisma.user.count({ where: { createdAt: { gte: d30 } } }),
    prisma.watchlistItem.count(),
    prisma.rating.count(),
    prisma.watchLog.count(),
    prisma.partnerRoom.count(),
    prisma.collection.count(),
    prisma.userAchievement.count(),
    prisma.user.findMany({
      take: 25,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        level: true,
        xp: true,
        _count: {
          select: { watchlist: true, ratings: true, watchLogs: true },
        },
      },
    }),
  ])

  return (
    <div className="space-y-10 max-w-5xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin Panel</h1>
        <p className="text-white/40 text-sm mt-1">Kinopolka — статистика в реальном времени</p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">Пользователи</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Всего" value={totalUsers} />
          <StatCard label="Новых за 7 дней" value={newUsers7d} highlight />
          <StatCard label="Новых за 30 дней" value={newUsers30d} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">Активность</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Вишлист" value={totalWatchlist} />
          <StatCard label="Оценки" value={totalRatings} />
          <StatCard label="Записей в дневнике" value={totalWatchLogs} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">Функции</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard label="Partner комнаты" value={totalPartnerRooms} />
          <StatCard label="Коллекции" value={totalCollections} />
          <StatCard label="Достижения" value={totalAchievements} />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xs font-semibold text-white/30 uppercase tracking-widest">
          Последние пользователи ({recentUsers.length})
        </h2>
        <UsersTable users={recentUsers} />
      </section>
    </div>
  )
}
