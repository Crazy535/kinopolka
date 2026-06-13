import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <h1 className="mb-2 text-5xl font-bold">404</h1>
      <p className="mb-2 text-lg font-medium">Страница не найдена</p>
      <p className="mb-8 text-sm text-muted-foreground">
        Возможно, она была удалена или вы ввели неправильный адрес.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        На главную
      </Link>
    </div>
  )
}
