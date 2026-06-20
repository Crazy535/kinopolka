interface UserRow {
  id: string
  name: string | null
  email: string
  createdAt: Date
  level: number
  xp: number
  _count: {
    watchlist: number
    ratings: number
    watchLogs: number
  }
}

export function UsersTable({ users }: { users: UserRow[] }) {
  if (users.length === 0) {
    return <p className="text-white/40 text-sm">Нет пользователей</p>
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-white/5 border-b border-white/10 text-white/40 text-xs">
            <th className="px-4 py-3 text-left font-medium">Пользователь</th>
            <th className="px-4 py-3 text-center font-medium">Ур.</th>
            <th className="px-4 py-3 text-center font-medium">XP</th>
            <th className="px-4 py-3 text-center font-medium">Вишлист</th>
            <th className="px-4 py-3 text-center font-medium">Оценки</th>
            <th className="px-4 py-3 text-center font-medium">Дневник</th>
            <th className="px-4 py-3 text-right font-medium">Регистрация</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr
              key={u.id}
              className="border-b border-white/5 last:border-0 hover:bg-white/[0.03] transition-colors"
            >
              <td className="px-4 py-3">
                <div className="font-medium">{u.name ?? <span className="text-white/30">—</span>}</div>
                <div className="text-white/35 text-xs">{u.email}</div>
              </td>
              <td className="px-4 py-3 text-center tabular-nums text-white/70">{u.level}</td>
              <td className="px-4 py-3 text-center tabular-nums text-amber-400/90 font-medium">{u.xp}</td>
              <td className="px-4 py-3 text-center tabular-nums">{u._count.watchlist}</td>
              <td className="px-4 py-3 text-center tabular-nums">{u._count.ratings}</td>
              <td className="px-4 py-3 text-center tabular-nums">{u._count.watchLogs}</td>
              <td className="px-4 py-3 text-right text-white/35 text-xs tabular-nums">
                {new Intl.DateTimeFormat('ru-RU', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                }).format(new Date(u.createdAt))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
