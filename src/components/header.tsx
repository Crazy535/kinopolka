import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/auth'
import { UserMenu } from '@/components/user-menu'
import { SearchBar } from '@/components/search-bar'
import { NavLinks } from '@/components/nav-links'

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-8">
          <Link href="/" aria-label="Кинополка — на главную">
            <Image
              src="/logo.png"
              alt="Кинополка"
              width={120}
              height={32}
              className="h-7 w-auto object-contain"
              priority
            />
          </Link>
          <NavLinks />
        </div>

        <div className="flex items-center gap-1">
          <SearchBar />
          <UserMenu user={session?.user ?? null} />
        </div>
      </div>
    </header>
  )
}
