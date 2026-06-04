'use client'

import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LogoutButton() {
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className="px-3 py-1.5 text-xs font-medium text-[#1a1a2e]/50 hover:text-[#1a1a2e] border border-[#1a1a2e]/12 hover:border-[#1a1a2e]/25 rounded-lg transition-colors hidden sm:block"
    >
      로그아웃
    </button>
  )
}
