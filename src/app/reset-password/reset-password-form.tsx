'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Logo } from '@/components/logo'

interface Props {
  token?: string
  email?: string
}

export function ResetPasswordForm({ token, email }: Props) {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  const isInvalid = !token || !email

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      setErrorMsg('Пароли не совпадают')
      setStatus('error')
      return
    }
    if (password.length < 8) {
      setErrorMsg('Пароль должен быть не менее 8 символов')
      setStatus('error')
      return
    }

    setStatus('loading')
    setErrorMsg('')

    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, token, password }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErrorMsg(data.error ?? 'Ошибка. Ссылка могла устареть.')
      setStatus('error')
    } else {
      router.push('/login?reset=1')
    }
  }

  if (isInvalid) {
    return (
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border/40 bg-card/60 p-8 shadow-xl backdrop-blur-xl text-center">
        <Logo />
        <p className="text-sm text-destructive">Недействительная ссылка. Запросите новую.</p>
        <Link href="/forgot-password" className="block text-sm text-primary hover:underline">
          Запросить сброс пароля
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border/40 bg-card/60 p-8 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo />
        <h1 className="text-2xl font-bold">Новый пароль</h1>
        <p className="text-sm text-muted-foreground">Введите новый пароль для {email}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium">Новый пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 focus:ring-2"
            placeholder="Минимум 8 символов"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">Повторите пароль</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 focus:ring-2"
            placeholder="••••••••"
          />
        </div>

        {status === 'error' && (
          <p className="text-sm text-destructive">{errorMsg}</p>
        )}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
        >
          {status === 'loading' ? 'Сохраняем...' : 'Сохранить пароль'}
        </button>
      </form>
    </div>
  )
}
