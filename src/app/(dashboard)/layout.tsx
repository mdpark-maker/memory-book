import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import LogoutButton from './_components/LogoutButton'
import MobileMenu from './_components/MobileMenu'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const displayName =
    user.user_metadata?.name || user.email?.split('@')[0] || '사용자'

  const navLinks = [
    { href: '/home', label: '홈' },
    { href: '/gallery', label: '갤러리' },
    { href: '/photobook', label: '포토북' },
    { href: '/orders', label: '주문' },
  ]

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-[#1a1a2e]/8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/home" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-[#1a1a2e] flex items-center justify-center">
              <span className="text-white text-xs font-bold">M</span>
            </div>
            <span className="text-[#1a1a2e] font-bold text-lg tracking-tight hidden sm:block">
              Memory Book
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-4 py-2 rounded-xl text-sm font-medium text-[#1a1a2e]/60 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right: User + Logout */}
          <div className="flex items-center gap-3">
            {/* User Avatar */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#e8a87c]/20 border-2 border-[#e8a87c]/40 flex items-center justify-center flex-shrink-0">
                <span className="text-[#e8a87c] text-xs font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-[#1a1a2e] hidden sm:block max-w-[120px] truncate">
                {displayName}
              </span>
            </div>

            <LogoutButton />

            {/* Mobile Menu Button */}
            <MobileMenu navLinks={navLinks} />
          </div>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
