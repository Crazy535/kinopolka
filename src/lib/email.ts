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
      <div style="font-family:sans-serif;background:#0A0B14;max-width:480px;margin:0 auto;border-radius:12px;overflow:hidden">
        <div style="background:#C41E3A;height:4px"></div>
        <div style="padding:40px 32px">
          <h1 style="font-family:Georgia,serif;color:#F5F3EF;font-size:26px;font-weight:700;margin:0 0 8px;letter-spacing:-0.02em">
            Добро пожаловать в Кинополку
          </h1>
          <p style="color:#9B9BAD;font-size:15px;line-height:1.6;margin:0 0 28px">
            Подтвердите email, чтобы начать подбор фильмов за&nbsp;30&nbsp;секунд
          </p>
          <a href="${url}" style="display:inline-block;background:#C41E3A;color:#fff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;font-size:15px">
            Подтвердить email
          </a>
          <p style="margin:24px 0 0;color:#6B6B7E;font-size:13px;line-height:1.5">
            Ссылка действительна 24 часа. Если вы не регистрировались — просто проигнорируйте письмо.
          </p>
        </div>
        <div style="padding:16px 32px;background:#0D0E1C;text-align:center">
          <p style="color:#4A4A5C;font-size:12px;margin:0">Кинополка &bull; kinopolka.vercel.app</p>
        </div>
      </div>
    `,
  })
}
