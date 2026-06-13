import Link from 'next/link'
import { auth } from '@/auth'
import { UserMenu } from '@/components/user-menu'
import { SearchBar } from '@/components/search-bar'

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground hover:text-foreground/80 transition-colors"
        >
          Кинополка
        </Link>
        <div className="flex items-center gap-1">
          <SearchBar />
          <UserMenu user={session?.user ?? null} />
        </div>
      </div>
    </header>
  )
}
