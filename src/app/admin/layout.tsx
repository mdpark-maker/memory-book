import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'

const ADMIN_EMAILS = [
  process.env.ADMIN_EMAIL,
  'mdpark12@gmail.com',
].filter(Boolean)

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const isAdmin = ADMIN_EMAILS.includes(user.email)

  if (!isAdmin) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-[#f5f5f7] flex">
      {/* Sidebar */}
      <aside className="w-56 bg-[#1a1a2e] flex flex-col py-6 px-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
            <span className="text-white text-xs font-bold">M</span>
          </div>
          <span className="text-white font-bold text-sm">관리자 패널</span>
        </div>

        <nav className="flex flex-col gap-1">
          <Link
            href="/admin/orders"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/70 hover:text-white hover:bg-white/10 text-sm font-medium transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            주문 관리
          </Link>
        </nav>

        <div className="mt-auto px-2">
          <p className="text-white/30 text-xs">{user.email}</p>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
