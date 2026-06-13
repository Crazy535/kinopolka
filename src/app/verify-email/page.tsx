import Link from 'next/link'

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>
}) {
  const { error } = await searchParams

  let title = 'Проверяем ваш email'
  let message = 'Подождите, идёт проверка...'

  if (error === 'invalid') {
    title = 'Неверная ссылка'
    message = 'Ссылка недействительна или уже была использована.'
  } else if (error === 'expired') {
    title = 'Ссылка устарела'
    message = 'Срок действия ссылки истёк. Зарегистрируйтесь снова.'
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-4">
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground">{message}</p>
        {error && (
          <Link href="/register" className="text-primary hover:underline text-sm">
            Зарегистрироваться снова
          </Link>
        )}
      </div>
    </main>
  )
}
