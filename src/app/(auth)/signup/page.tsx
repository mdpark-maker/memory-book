'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function SignupPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const supabase = createClient()

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (password !== confirmPassword) {
      setError('비밀번호가 일치하지 않습니다.')
      return
    }
    if (password.length < 6) {
      setError('비밀번호는 6자 이상이어야 합니다.')
      return
    }

    setLoading(true)

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    setLoading(false)

    if (error) {
      console.error('Signup error:', error)
      if (error.message.includes('already registered') || error.message.includes('already been registered')) {
        setError('이미 사용 중인 이메일입니다. 로그인해 주세요.')
      } else if (error.message.includes('password')) {
        setError('비밀번호는 6자 이상이어야 합니다.')
      } else {
        setError(`오류: ${error.message}`)
      }
      return
    }

    window.location.href = '/home'
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
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">회원가입</h1>
          <p className="text-[#1a1a2e]/50 text-sm">메모리북과 함께 소중한 순간을 담아보세요</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSignup} className="flex flex-col gap-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
              이름
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
            />
          </div>

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
              placeholder="6자 이상 입력해 주세요"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
              비밀번호 확인
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="비밀번호를 다시 입력해 주세요"
              required
              className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-[#1a1a2e] hover:bg-[#2d2d4e] disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold text-sm rounded-2xl transition-all hover:shadow-lg hover:shadow-[#1a1a2e]/20 mt-2"
          >
            {loading ? '가입 중...' : '회원가입'}
          </button>
        </form>

        <p className="text-center text-sm text-[#1a1a2e]/50 mt-6">
          이미 계정이 있으신가요?{' '}
          <Link href="/login" className="text-[#e8a87c] font-semibold hover:underline">
            로그인
          </Link>
        </p>
      </div>
    </div>
  )
}
