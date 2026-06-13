import { LoginForm } from './login-form'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ verified?: string }>
}) {
  const { verified } = await searchParams
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <LoginForm verified={!!verified} />
    </main>
  )
}
