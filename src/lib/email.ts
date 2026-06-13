import 'server-only'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
const FROM = process.env.RESEND_FROM_EMAIL ?? 'onboarding@resend.dev'

export async function sendVerificationEmail(email: string, token: string, baseUrl: string) {
  const url = `${baseUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: 'Подтвердите email — Кинополка',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto">
        <h2>Добро пожаловать в Кинополку!</h2>
        <p>Нажмите кнопку ниже, чтобы подтвердить ваш email:</p>
        <a href="${url}" style="display:inline-block;background:#e50914;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold">
          Подтвердить email
        </a>
        <p style="margin-top:16px;color:#666;font-size:14px">
          Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте письмо.
        </p>
      </div>
    `,
  })
}
