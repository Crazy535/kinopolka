import { NextRequest, NextResponse } from 'next/server'

const PROTECTED = ['/profile', '/watchlist', '/partner']

// Optimistic check: verifies session cookie exists without hitting the DB.
// Actual auth enforcement happens in Server Components via auth().
export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p))
  if (isProtected) {
    const sessionCookie =
      req.cookies.get('authjs.session-token')?.value ??
      req.cookies.get('__Secure-authjs.session-token')?.value

    if (!sessionCookie) {
      return NextResponse.redirect(new URL('/', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
