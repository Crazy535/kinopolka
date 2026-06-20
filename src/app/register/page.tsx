import { RegisterForm } from './register-form'

export default async function RegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams
  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <RegisterForm referralCode={ref} />
    </main>
  )
}
