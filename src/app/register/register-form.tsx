'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export function RegisterForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, password }),
      })

      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error ?? 'Ошибка регистрации')
      } else {
        setSuccess(true)
      }
    } catch {
      setError('Ошибка соединения. Попробуйте снова.')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="w-full max-w-sm space-y-4 rounded-2xl border border-border/40 bg-card/60 p-8 text-center shadow-xl backdrop-blur-xl">
        <h1 className="text-2xl font-bold">Проверьте почту</h1>
        <p className="text-muted-foreground">
          Мы отправили письмо на <strong>{email}</strong>.<br />
          Перейдите по ссылке в письме, чтобы подтвердить email.
        </p>
        <Link href="/login" className="text-sm text-primary hover:underline">
          Уже подтвердили? Войти
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border/40 bg-card/60 p-8 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo />
        <h1 className="text-2xl font-bold">Регистрация</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Имя (необязательно)</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 focus:ring-2"
            placeholder="Ваше имя"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Почта</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 focus:ring-2"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 focus:ring-2"
            placeholder="Не менее 8 символов"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {loading ? 'Создаём аккаунт...' : 'Создать аккаунт'}
        </button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Войти
        </Link>
      </p>
    </div>
  )
}
