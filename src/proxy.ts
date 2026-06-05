import { NextResponse, type NextRequest } from 'next/server'

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup')
  const isProtected =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/gallery') ||
    pathname.startsWith('/upload') ||
    pathname.startsWith('/photobook') ||
    pathname.startsWith('/checkout') ||
    pathname.startsWith('/orders') ||
    pathname === '/home' ||
    pathname.startsWith('/home/')

  // Lightweight check: session cookie exists (actual verification happens in layouts)
  const hasSession = request.cookies.getAll().some(
    (c) => c.name.startsWith('sb-') && c.name.includes('-auth-token')
  )

  if (isProtected && !hasSession) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if (isAuthPage && hasSession) {
    return NextResponse.redirect(new URL('/home', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}
