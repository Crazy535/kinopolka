'use client'

import { useState } from 'react'
import { Copy, Check, Users } from 'lucide-react'

interface Props {
  referralCode: string
  referralCount: number
  baseUrl: string
}

export function ReferralSection({ referralCode, referralCount, baseUrl }: Props) {
  const [copied, setCopied] = useState(false)
  const link = `${baseUrl}/register?ref=${referralCode}`

  async function handleCopy() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="mb-10">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-widest text-muted-foreground">
        Реферальная программа
      </h2>
      <div className="rounded-xl border border-border bg-card/60 p-5">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-full bg-primary/15">
            <Users className="size-5 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Пригласи друга</p>
            <p className="text-sm text-muted-foreground">
              +150 XP за каждого, кто зарегистрируется по твоей ссылке
            </p>
          </div>
          {referralCount > 0 && (
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-primary">{referralCount}</p>
              <p className="text-xs text-muted-foreground">
                {referralCount === 1 ? 'приглашён' : referralCount < 5 ? 'приглашено' : 'приглашено'}
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2">
          <span className="flex-1 truncate font-mono text-xs text-muted-foreground">{link}</span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex shrink-0 items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {copied ? (
              <>
                <Check className="size-3.5" />
                Скопировано
              </>
            ) : (
              <>
                <Copy className="size-3.5" />
                Копировать
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
