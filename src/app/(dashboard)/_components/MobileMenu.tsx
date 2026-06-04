'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

interface NavLink {
  href: string
  label: string
}

export default function MobileMenu({ navLinks }: { navLinks: NavLink[] }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-8 h-8 flex flex-col items-center justify-center gap-1.5 rounded-lg hover:bg-[#1a1a2e]/5 transition-colors"
        aria-label="메뉴 열기"
      >
        <span
          className={`w-5 h-0.5 bg-[#1a1a2e] rounded transition-all ${open ? 'rotate-45 translate-y-2' : ''}`}
        />
        <span
          className={`w-5 h-0.5 bg-[#1a1a2e] rounded transition-all ${open ? 'opacity-0' : ''}`}
        />
        <span
          className={`w-5 h-0.5 bg-[#1a1a2e] rounded transition-all ${open ? '-rotate-45 -translate-y-2' : ''}`}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-16 left-0 right-0 bg-white border-b border-[#1a1a2e]/8 shadow-lg z-50">
          <nav className="max-w-6xl mx-auto px-4 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="px-4 py-3 rounded-xl text-sm font-medium text-[#1a1a2e]/70 hover:text-[#1a1a2e] hover:bg-[#1a1a2e]/5 transition-colors"
              >
                {link.label}
              </Link>
            ))}
            <div className="h-px bg-[#1a1a2e]/8 my-2" />
            <button
              onClick={handleLogout}
              className="px-4 py-3 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-colors text-left"
            >
              로그아웃
            </button>
          </nav>
        </div>
      )}
    </div>
  )
}
