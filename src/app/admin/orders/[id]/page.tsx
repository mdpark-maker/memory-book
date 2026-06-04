'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Order, OrderStatus } from '@/types'

const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: '결제 대기',
  paid: '결제 완료',
  processing: '제작 중',
  shipped: '배송 중',
  delivered: '배달 완료',
  cancelled: '취소됨',
}

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: 'bg-gray-100 text-gray-600',
  paid: 'bg-blue-100 text-blue-700',
  processing: 'bg-yellow-100 text-yellow-700',
  shipped: 'bg-green-100 text-green-700',
  delivered: 'bg-emerald-100 text-emerald-700',
  cancelled: 'bg-red-100 text-red-600',
}

export default function AdminOrderDetailPage() {
  const params = useParams()
  const orderId = params.id as string

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    fetchOrder()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId])

  async function fetchOrder() {
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`)
      if (!res.ok) { setLoading(false); return }
      const data = await res.json()
      setOrder(data.order)
      setTrackingNumber(data.order.tracking_number || '')
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  async function updateOrder(updates: Partial<Pick<Order, 'status' | 'tracking_number'>>) {
    setSaving(true)
    setMessage(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      const data = await res.json()
      if (!res.ok) {
        setMessage({ type: 'error', text: data.error || '저장에 실패했습니다.' })
      } else {
        setOrder(data.order)
        setTrackingNumber(data.order.tracking_number || '')
        setMessage({ type: 'success', text: '저장됐습니다.' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch {
      setMessage({ type: 'error', text: '네트워크 오류가 발생했습니다.' })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-96">
        <div className="text-[#1a1a2e]/40 text-sm">불러오는 중...</div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="p-8">
        <p className="text-[#1a1a2e]/50">주문을 찾을 수 없습니다.</p>
        <Link href="/admin/orders" className="text-[#e8a87c] text-sm mt-2 inline-block">목록으로</Link>
      </div>
    )
  }

  const status = order.status as OrderStatus
  const createdAt = new Date(order.created_at)
  const formattedCreated = `${createdAt.getFullYear()}.${createdAt.getMonth()+1}.${createdAt.getDate()} ${String(createdAt.getHours()).padStart(2,'0')}:${String(createdAt.getMinutes()).padStart(2,'0')}`

  return (
    <div className="p-8 max-w-2xl">
      <div className="mb-7">
        <Link href="/admin/orders" className="flex items-center gap-2 text-[#1a1a2e]/50 hover:text-[#1a1a2e] text-sm mb-4 transition-colors">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          주문 목록
        </Link>
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-[#1a1a2e]">주문 상세</h1>
          <span className={`px-3 py-1.5 rounded-full text-xs font-semibold ${STATUS_COLORS[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>
        <p className="text-[#1a1a2e]/40 text-sm mt-1 font-mono">{order.id}</p>
      </div>

      {message && (
        <div className={`mb-5 px-4 py-3 rounded-xl text-sm font-medium ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-600'
        }`}>
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 mb-4">
        <h2 className="font-semibold text-[#1a1a2e] mb-4 text-sm">주문 정보</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-[#1a1a2e]/40 text-xs mb-1">주문 번호</p>
            <p className="font-mono font-medium text-[#1a1a2e]">{order.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div>
            <p className="text-[#1a1a2e]/40 text-xs mb-1">주문 일시</p>
            <p className="text-[#1a1a2e]">{formattedCreated}</p>
          </div>
          <div>
            <p className="text-[#1a1a2e]/40 text-xs mb-1">결제 금액</p>
            <p className="font-bold text-[#1a1a2e]">{order.total_price.toLocaleString()}원</p>
          </div>
          <div>
            <p className="text-[#1a1a2e]/40 text-xs mb-1">카카오 TID</p>
            <p className="font-mono text-xs text-[#1a1a2e]/60 break-all">{order.kakao_tid || '-'}</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 mb-4">
        <h2 className="font-semibold text-[#1a1a2e] mb-4 text-sm">배송 정보</h2>
        <div className="flex flex-col gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-[#1a1a2e]/50">받는 분</span>
            <span className="font-medium text-[#1a1a2e]">{order.shipping_name}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#1a1a2e]/50">연락처</span>
            <span className="text-[#1a1a2e]">{order.shipping_phone}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-[#1a1a2e]/50 flex-shrink-0">주소</span>
            <span className="text-[#1a1a2e] text-right">
              {order.shipping_address}
              {order.shipping_detail && `, ${order.shipping_detail}`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5 mb-4">
        <h2 className="font-semibold text-[#1a1a2e] mb-4 text-sm">운송장 번호</h2>
        <div className="flex gap-3">
          <input
            type="text"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="운송장 번호를 입력하세요"
            className="flex-1 px-4 py-2.5 rounded-xl border border-[#1a1a2e]/15 bg-[#faf8f5] text-[#1a1a2e] placeholder-[#1a1a2e]/30 text-sm focus:outline-none focus:border-[#e8a87c] focus:ring-2 focus:ring-[#e8a87c]/20 transition-colors font-mono"
          />
          <button
            onClick={() => updateOrder({ tracking_number: trackingNumber })}
            disabled={saving}
            className="px-4 py-2.5 bg-[#1a1a2e] text-white text-sm font-semibold rounded-xl hover:bg-[#2d2d4e] disabled:opacity-60 transition-colors"
          >
            {saving ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#1a1a2e]/8 p-5">
        <h2 className="font-semibold text-[#1a1a2e] mb-4 text-sm">상태 변경</h2>
        <div className="flex flex-wrap gap-2.5">
          {status !== 'processing' && status !== 'shipped' && status !== 'delivered' && status !== 'cancelled' && (
            <button onClick={() => updateOrder({ status: 'processing' })} disabled={saving}
              className="px-4 py-2.5 bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm font-semibold rounded-xl hover:bg-yellow-100 disabled:opacity-60 transition-colors">
              제작중으로 변경
            </button>
          )}
          {(status === 'processing' || status === 'paid') && (
            <button onClick={() => updateOrder({ status: 'shipped' })} disabled={saving}
              className="px-4 py-2.5 bg-green-50 border border-green-200 text-green-700 text-sm font-semibold rounded-xl hover:bg-green-100 disabled:opacity-60 transition-colors">
              배송중으로 변경
            </button>
          )}
          {status === 'shipped' && (
            <button onClick={() => updateOrder({ status: 'delivered' })} disabled={saving}
              className="px-4 py-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-xl hover:bg-emerald-100 disabled:opacity-60 transition-colors">
              배달완료로 변경
            </button>
          )}
          {status !== 'cancelled' && status !== 'delivered' && (
            <button onClick={() => updateOrder({ status: 'cancelled' })} disabled={saving}
              className="px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-sm font-semibold rounded-xl hover:bg-red-100 disabled:opacity-60 transition-colors">
              주문 취소
            </button>
          )}
          {(status === 'delivered' || status === 'cancelled') && (
            <p className="text-[#1a1a2e]/40 text-sm self-center">더 이상 변경할 수 없습니다.</p>
          )}
        </div>
      </div>
    </div>
  )
}
