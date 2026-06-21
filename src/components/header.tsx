import { auth } from '@/auth'
import { UserMenu } from '@/components/user-menu'
import { SearchBar } from '@/components/search-bar'
import { NavLinks } from '@/components/nav-links'
import { Logo } from '@/components/logo'
import { HeaderShell } from '@/components/header-shell'

export async function Header() {
  const session = await auth()

  return (
    <HeaderShell>
      <div className="mx-auto flex h-[4.25rem] max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6 sm:gap-8">
          <Logo />
          <NavLinks isAuthenticated={!!session?.user} />
        </div>

        <div className="flex items-center gap-1">
          <SearchBar />
          <UserMenu user={session?.user ?? null} />
        </div>
      </div>
    </HeaderShell>
  )
}
