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

  // Lightweight check: session cookie for this specific project exists
  // Cookie name format: sb-<projectRef>-auth-token (or .0, .1 for chunked)
  const projectRef = process.env.NEXT_PUBLIC_SUPABASE_URL!.split('//')[1].split('.')[0]
  const hasSession =
    request.cookies.has(`sb-${projectRef}-auth-token`) ||
    request.cookies.has(`sb-${projectRef}-auth-token.0`)

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
