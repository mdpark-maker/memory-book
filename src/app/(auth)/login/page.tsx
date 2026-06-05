'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleEmailLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      console.error('Login error:', error)
      if (error.message.includes('Invalid login credentials')) {
        setError('이메일 또는 비밀번호가 올바르지 않습니다.')
      } else if (error.message.includes('Email not confirmed')) {
        setError('이메일 인증을 완료해 주세요. 받은편지함을 확인해 주세요.')
      } else {
        setError(`오류: ${error.message}`)
      }
      setLoading(false)
      return
    }

    window.location.href = '/'
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center px-4 py-12">
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] flex items-center justify-center">
          <span className="text-white text-sm font-bold">M</span>
        </div>
        <span className="text-[#1a1a2e] font-bold text-xl tracking-tight">Memory Book</span>
      </Link>

      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#1a1a2e]/8 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">로그인</h1>
          <p className="text-[#1a1a2e]/50 text-sm">메모리북에 오신 것을 환영합니다</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="flex flex-col gap-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
              이메일
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="hello@example.com"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
              비밀번호
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1a1a2e] hover:bg-[#2d2d4e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl transition-all hover:shadow-lg hover:shadow-[#1a1a2e]/20 mt-2"
          >
            {loading ? '로그인 중...' : '로그인'}
          </button>
        </form>

        <p className="text-center text-sm text-[#1a1a2e]/50 mt-6">
          아직 계정이 없으신가요?{' '}
          <Link href="/signup" className="text-[#e8a87c] font-semibold hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  )
}
