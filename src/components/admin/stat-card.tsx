interface Props {
  label: string
  value: number
  highlight?: boolean
}

export function StatCard({ label, value, highlight }: Props) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-5">
      <p className="text-xs text-white/40 font-medium">{label}</p>
      <p className={`mt-2 text-3xl font-bold tabular-nums ${highlight ? 'text-emerald-400' : ''}`}>
        {value.toLocaleString('ru-RU')}
      </p>
    </div>
  )
}
