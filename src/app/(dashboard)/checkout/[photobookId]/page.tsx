'use client'

import { useState, Suspense } from 'react'
import { useRouter, useParams, useSearchParams } from 'next/navigation'

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#faf8f5] flex items-center justify-center"><div className="text-[#1a1a2e]/40 text-sm">불러오는 중...</div></div>}>
      <CheckoutContent />
    </Suspense>
  )
}

function CheckoutContent() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const photobookId = params.photobookId as string

  const hasError = searchParams.get('error') === 'true'
  const wasCancelled = searchParams.get('cancelled') === 'true'

  const [form, setForm] = useState({
    shipping_name: '',
    shipping_phone: '',
    shipping_address: '',
    shipping_detail: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(
    hasError ? '결제 중 오류가 발생했습니다. 다시 시도해 주세요.' :
    wasCancelled ? '결제가 취소됐습니다.' : null
  )

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/payment/kakao/ready', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photobookId, ...form }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || '결제 준비 중 오류가 발생했습니다.')
        setLoading(false)
        return
      }

      // Detect mobile
      const isMobile = /Mobi|Android/i.test(navigator.userAgent)
      const redirectUrl = isMobile ? data.mobileRedirectUrl : data.redirectUrl

      window.location.href = redirectUrl
    } catch {
      setError('네트워크 오류가 발생했습니다. 다시 시도해 주세요.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#faf8f5] py-10 px-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#1a1a2e]/50 hover:text-[#1a1a2e] text-sm mb-4 transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            뒤로
          </button>
          <h1 className="text-2xl font-bold text-[#1a1a2e]">주문 / 결제</h1>
          <p className="text-[#1a1a2e]/50 text-sm mt-1">배송 정보를 입력하고 결제를 진행해 주세요</p>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
            {error}
          </div>
        )}

        {/* Order Summary */}
        <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 mb-6">
          <h2 className="font-semibold text-[#1a1a2e] mb-4">주문 상품</h2>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-[#1a1a2e]/5 flex items-center justify-center">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <path d="M3 9h18M9 21V9"/>
                </svg>
              </div>
              <div>
                <p className="font-medium text-[#1a1a2e] text-sm">Memory Book 포토북</p>
                <p className="text-[#1a1a2e]/40 text-xs">30장 인화 · A5 무선제본</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-[#1a1a2e]">15,000원</p>
              <p className="text-[#1a1a2e]/40 text-xs">수량 1</p>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-[#1a1a2e]/8 flex justify-between items-center">
            <span className="text-sm text-[#1a1a2e]/60">배송비</span>
            <span className="text-sm font-medium text-[#e8a87c]">무료</span>
          </div>
          <div className="mt-3 flex justify-between items-center">
            <span className="font-semibold text-[#1a1a2e]">총 결제 금액</span>
            <span className="text-xl font-bold text-[#1a1a2e]">15,000원</span>
          </div>
        </div>

        {/* Shipping Form */}
        <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 mb-6">
          <h2 className="font-semibold text-[#1a1a2e] mb-4">배송 정보</h2>
          <form id="checkout-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
                받는 분 이름 <span className="text-red-500">*</span>
              </label>
              <input
                name="shipping_name"
                type="text"
                value={form.shipping_name}
                onChange={handleChange}
                placeholder="홍길동"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
                연락처 <span className="text-red-500">*</span>
              </label>
              <input
                name="shipping_phone"
                type="tel"
                value={form.shipping_phone}
                onChange={handleChange}
                placeholder="010-1234-5678"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
                배송 주소 <span className="text-red-500">*</span>
              </label>
              <input
                name="shipping_address"
                type="text"
                value={form.shipping_address}
                onChange={handleChange}
                placeholder="서울특별시 강남구 테헤란로 123"
                required
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a1a2e] mb-1.5">
                상세 주소
              </label>
              <input
                name="shipping_detail"
                type="text"
                value={form.shipping_detail}
                onChange={handleChange}
                placeholder="아파트 동/호수, 층 등"
                className="w-full px-4 py-3 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors"
              />
            </div>
          </form>
        </div>

        {/* Pay Button */}
        <button
          type="submit"
          form="checkout-form"
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-4 bg-[#FEE500] hover:bg-[#f5dc00] disabled:opacity-60 disabled:cursor-not-allowed rounded-2xl text-[#1a1a2e] font-bold text-base transition-all hover:shadow-lg hover:shadow-[#FEE500]/40"
        >
          {loading ? (
            <>
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              결제 준비 중...
            </>
          ) : (
            <>
              <KakaoIcon />
              카카오페이로 결제
            </>
          )}
        </button>

        <p className="text-center text-xs text-[#1a1a2e]/40 mt-4">
          결제 진행 시 <span className="underline">이용약관</span> 및 <span className="underline">개인정보 처리방침</span>에 동의하는 것으로 간주됩니다.
        </p>
      </div>
    </div>
  )
}

function KakaoIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M9 1C4.477 1 0.818 3.925 0.818 7.526c0 2.281 1.518 4.282 3.808 5.449L3.6 16.228a.228.228 0 00.347.245l4.09-2.72c.316.03.636.046.963.046 4.523 0 8.182-2.924 8.182-6.273C17.182 3.925 13.523 1 9 1z"
        fill="#1a1a2e"
      />
    </svg>
  )
}
