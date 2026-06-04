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
  const [success, setSuccess] = useState(false)

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
      if (error.message.includes('already registered')) {
        setError('이미 사용 중인 이메일입니다. 로그인해 주세요.')
      } else if (error.message.includes('password')) {
        setError('비밀번호는 6자 이상이어야 합니다.')
      } else {
        setError('회원가입 중 오류가 발생했습니다. 다시 시도해 주세요.')
      }
      return
    }

    setSuccess(true)
  }

  async function handleKakaoLogin() {
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  async function handleGoogleLogin() {
    setError(null)
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center px-4 py-12">
        <Link href="/" className="flex items-center gap-2 mb-10">
          <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] flex items-center justify-center">
            <span className="text-white text-sm font-bold">M</span>
          </div>
          <span className="text-[#1a1a2e] font-bold text-xl tracking-tight">Memory Book</span>
        </Link>

        <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#1a1a2e]/8 p-8 text-center">
          <div className="w-16 h-16 bg-[#e8a87c]/15 rounded-full flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">📬</span>
          </div>
          <h2 className="text-2xl font-bold text-[#1a1a2e] mb-3">이메일을 확인해 주세요!</h2>
          <p className="text-[#1a1a2e]/55 text-sm leading-relaxed mb-6">
            <span className="font-semibold text-[#1a1a2e]">{email}</span>로 인증 이메일을 보냈어요.
            <br />
            이메일의 링크를 클릭하면 가입이 완료돼요.
          </p>
          <Link
            href="/login"
            className="inline-block px-6 py-3 bg-[#1a1a2e] text-white text-sm font-semibold rounded-2xl hover:bg-[#2d2d4e] transition-colors"
          >
            로그인 페이지로 이동
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 mb-10">
        <div className="w-9 h-9 rounded-xl bg-[#1a1a2e] flex items-center justify-center">
          <span className="text-white text-sm font-bold">M</span>
        </div>
        <span className="text-[#1a1a2e] font-bold text-xl tracking-tight">Memory Book</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-sm border border-[#1a1a2e]/8 p-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1a1a2e] mb-1">회원가입</h1>
          <p className="text-[#1a1a2e]/50 text-sm">메모리북과 함께 소중한 순간을 담아보세요</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Social Signup Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          <button
            onClick={handleKakaoLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-[#FEE500] hover:bg-[#f5dc00] rounded-2xl text-[#1a1a2e] font-semibold text-sm transition-all hover:shadow-md hover:shadow-[#FEE500]/30"
          >
            <KakaoIcon />
            카카오로 시작하기
          </button>

          <button
            onClick={handleGoogleLogin}
            type="button"
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 bg-white hover:bg-gray-50 rounded-2xl text-[#1a1a2e] font-semibold text-sm border-2 border-[#1a1a2e]/10 transition-all hover:border-[#1a1a2e]/20"
          >
            <GoogleIcon />
            구글로 시작하기
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-[#1a1a2e]/10" />
          <span className="text-[#1a1a2e]/35 text-xs">또는 이메일로</span>
          <div className="flex-1 h-px bg-[#1a1a2e]/10" />
        </div>

        {/* Sign Up Form */}
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
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-[#1a1a2e] mb-1.5"
            >
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

        {/* Login Link */}
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

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C4.477 1 0.818 3.925 0.818 7.526c0 2.281 1.518 4.282 3.808 5.449L3.6 16.228a.228.228 0 00.347.245l4.09-2.72c.316.03.636.046.963.046 4.523 0 8.182-2.924 8.182-6.273C17.182 3.925 13.523 1 9 1z"
        fill="#1a1a2e"
      />
    </svg>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
        fill="#4285F4"
      />
      <path
        d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
        fill="#34A853"
      />
      <path
        d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
        fill="#FBBC05"
      />
      <path
        d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
        fill="#EA4335"
      />
    </svg>
  )
}
