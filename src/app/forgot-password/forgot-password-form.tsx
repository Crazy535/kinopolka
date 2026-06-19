'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Logo } from '@/components/logo'

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'error'>('idle')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus('loading')

    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    setStatus(res.ok ? 'sent' : 'error')
  }

  return (
    <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border/40 bg-card/60 p-8 shadow-xl backdrop-blur-xl">
      <div className="flex flex-col items-center gap-3 text-center">
        <Logo />
        <h1 className="text-2xl font-bold">Восстановление пароля</h1>
        <p className="text-sm text-muted-foreground">
          Введите email — мы пришлём ссылку для сброса
        </p>
      </div>

      {status === 'sent' ? (
        <div className="space-y-4 text-center">
          <p className="text-sm text-green-600">
            Письмо отправлено! Проверьте почту — ссылка действительна 1 час.
          </p>
          <Link href="/login" className="block text-sm text-primary hover:underline">
            Вернуться ко входу
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {status === 'error' && (
            <p className="text-sm text-destructive">Что-то пошло не так. Попробуйте ещё раз.</p>
          )}

          <button
            type="submit"
            disabled={status === 'loading'}
            className="w-full rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {status === 'loading' ? 'Отправляем...' : 'Отправить ссылку'}
          </button>

          <p className="text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              Вернуться ко входу
            </Link>
          </p>
        </form>
      )}
    </div>
  )
}
