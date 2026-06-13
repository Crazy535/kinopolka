import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/auth'
import { UserMenu } from '@/components/user-menu'
import { SearchBar } from '@/components/search-bar'
import { NavLinks } from '@/components/nav-links'

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/[0.06] bg-background/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" aria-label="Кинополка — на главную">
            <Image
              src="/logo.png"
              alt="Кинополка"
              width={140}
              height={36}
              className="h-8 w-auto object-contain"
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
