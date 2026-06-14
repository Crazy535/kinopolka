import { auth } from '@/auth'
import { UserMenu } from '@/components/user-menu'
import { SearchBar } from '@/components/search-bar'
import { NavLinks } from '@/components/nav-links'
import { Logo } from '@/components/logo'

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/92 backdrop-blur-md supports-[backdrop-filter]:bg-background/75">
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6 sm:gap-8">
          <Logo />
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
