'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from 'lucide-react'

interface Props {
  initialName: string
  initialEmailUnsubscribed: boolean
  hasPassword: boolean
}

type SectionStatus = 'idle' | 'saving' | 'saved' | 'error'

export function SettingsForm({ initialName, initialEmailUnsubscribed, hasPassword }: Props) {
  const router = useRouter()

  // Profile section
  const [name, setName] = useState(initialName)
  const [profileStatus, setProfileStatus] = useState<SectionStatus>('idle')
  const [profileError, setProfileError] = useState('')

  // Email preferences
  const [emailUnsubscribed, setEmailUnsubscribed] = useState(initialEmailUnsubscribed)
  const [emailStatus, setEmailStatus] = useState<SectionStatus>('idle')

  // Password section
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState<SectionStatus>('idle')
  const [passwordError, setPasswordError] = useState('')

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    setProfileStatus('saving')
    setProfileError('')

    const res = await fetch('/api/profile/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setProfileError(data.error ?? 'Ошибка сохранения')
      setProfileStatus('error')
    } else {
      setProfileStatus('saved')
      router.refresh()
      setTimeout(() => setProfileStatus('idle'), 2500)
    }
  }

  async function saveEmailPref(checked: boolean) {
    setEmailUnsubscribed(checked)
    setEmailStatus('saving')

    const res = await fetch('/api/profile/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailUnsubscribed: checked }),
    })

    if (res.ok) {
      setEmailStatus('saved')
      setTimeout(() => setEmailStatus('idle'), 2500)
    } else {
      setEmailStatus('error')
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Пароли не совпадают')
      setPasswordStatus('error')
      return
    }
    if (newPassword.length < 8) {
      setPasswordError('Новый пароль — минимум 8 символов')
      setPasswordStatus('error')
      return
    }

    setPasswordStatus('saving')

    const res = await fetch('/api/profile/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword, newPassword }),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setPasswordError(data.error ?? 'Ошибка смены пароля')
      setPasswordStatus('error')
    } else {
      setPasswordStatus('saved')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordStatus('idle'), 2500)
    }
  }

  return (
    <div className="space-y-8">
      {/* Profile section */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold">Данные профиля</h2>
        <form onSubmit={saveProfile} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium">Имя</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={64}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2 sm:max-w-sm"
              placeholder="Ваше имя"
            />
          </div>

          {profileStatus === 'error' && (
            <p className="text-sm text-destructive">{profileError}</p>
          )}

          <button
            type="submit"
            disabled={profileStatus === 'saving' || name.trim() === initialName && profileStatus !== 'error'}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] active:bg-primary/80 disabled:opacity-50"
          >
            {profileStatus === 'saved' && <Check className="h-4 w-4" />}
            {profileStatus === 'saving' ? 'Сохраняем...' : profileStatus === 'saved' ? 'Сохранено' : 'Сохранить'}
          </button>
        </form>
      </section>

      {/* Email preferences */}
      <section className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-base font-semibold">Email-уведомления</h2>
        <label className="flex cursor-pointer items-center gap-3">
          <div className="relative">
            <input
              type="checkbox"
              className="sr-only"
              checked={!emailUnsubscribed}
              onChange={(e) => saveEmailPref(!e.target.checked)}
              disabled={emailStatus === 'saving'}
            />
            <div
              className={`h-5 w-9 rounded-full transition-colors ${
                !emailUnsubscribed ? 'bg-primary' : 'bg-muted-foreground/30'
              }`}
            />
            <div
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                !emailUnsubscribed ? 'translate-x-4' : 'translate-x-0.5'
              }`}
            />
          </div>
          <div>
            <p className="text-sm font-medium">Получать email-рассылку</p>
            <p className="text-xs text-muted-foreground">Еженедельные подборки фильмов и новости</p>
          </div>
          {emailStatus === 'saved' && (
            <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />
          )}
        </label>
      </section>

      {/* Password section — only for email/password accounts */}
      {hasPassword && (
        <section className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-base font-semibold">Смена пароля</h2>
          <form onSubmit={savePassword} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Текущий пароль</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2 sm:max-w-sm"
                placeholder="••••••••"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Новый пароль</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2 sm:max-w-sm"
                placeholder="Минимум 8 символов"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Повторите новый пароль</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-primary/50 transition-shadow focus:ring-2 sm:max-w-sm"
                placeholder="••••••••"
              />
            </div>

            {passwordStatus === 'error' && (
              <p className="text-sm text-destructive">{passwordError}</p>
            )}

            <button
              type="submit"
              disabled={passwordStatus === 'saving'}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 active:scale-[0.97] active:bg-primary/80 disabled:opacity-50"
            >
              {passwordStatus === 'saved' && <Check className="h-4 w-4" />}
              {passwordStatus === 'saving' ? 'Сохраняем...' : passwordStatus === 'saved' ? 'Пароль изменён' : 'Изменить пароль'}
            </button>
          </form>
        </section>
      )}
    </div>
  )
}
