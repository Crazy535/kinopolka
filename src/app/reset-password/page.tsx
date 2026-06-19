import { ResetPasswordForm } from './reset-password-form'

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; email?: string }>
}) {
  const { token, email } = await searchParams
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <ResetPasswordForm token={token} email={email} />
    </main>
  )
}
